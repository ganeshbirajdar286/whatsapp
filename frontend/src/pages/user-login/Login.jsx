import { useState } from 'react';
import useLoginStore from '../../store/useLoginStore'
import countries from '../../utils/Countriles';
import * as yup from "yup"; // import everything (*) from the yup module as a single object, and name that object yup.
import { yupResolver } from "@hookform/resolvers/yup"
import useUserStore from '../../store/useUserStore';
import { useForm } from "react-hook-form"
import useThemeStore from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaArrowLeft, FaChevronDown, FaWhatsapp } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import Spinner from '../../utils/Spinner.jsx';
import { sendOtp, updateUserProfile, verifyOtp } from '../services/user.services.js';
import { toast } from 'react-toastify';
import { FaPlus } from "react-icons/fa";



//validation schema


//  eg :-let userSchema = object({   
//   name: string().required(),
//   age: number().required().positive().integer(),
//   email: string().email(),
//   website: string().url().nullable(),
//   createdOn: date().default(() => new Date()),
// });

// object({...}) This is a shortcut for yup.object().shape({...}). It creates a schema for an object with the listed fields.



const loginValidationSchema = yup
  .object()  //yup.object() Creates a Yup schema for an object
  .shape({
    phoneNumber: yup.string()
      .nullable() //nullable() → allows the value to be null.
      .notRequired()  //notRequired() → makes the field optional.
      .matches(/^\d+$/, "Phone number must be digits")//matches(/^\d+$/) → if the user enters something, it must contain only digits.
      .transform((value, originalValue) => { // Runs before validation. Lets you change the input (originalValue) into something else (value).
        return originalValue.trim() === "" ? null : value;

        // explaination 
        //     If user types "12345" → stays "12345".
        // If user types " "(just spaces) → transformed into null → ✅ passes because nullable() allows it.
        // If field is missing → ✅ passes because notRequired().
        // If user types "abc123" → ❌ fails "Phone number must be digits".


        //  Yup passes two arguments to your transform function:
        // originalValue → the raw input value (exactly what the user entered or what your data has before Yup touches it).
        // value → the parsed/converted version of that input, based on the type of schema

      }),
    email: yup.string()
      .nullable()
      .notRequired()
      .email("please enter  valid email")
      .transform((value, originalValue) => {
        return originalValue.trim() === "" ? null : value;
      })// .test(                                 .test can be  writen   here also
    //   "at-least-one",  
    //   "Either email or phone number is required",
    //   function (value) {
    //     const { phoneNumber } = this.parent  // sibling field
    //     return !!(phoneNumber || value)  // value IS the email itself

    //The !! (double exclamation) is a JavaScript trick to convert any value into a strict boolean (true or false).
    //           How it works:
    // !value → negates the value (turns truthy into false, falsy into true).
    // !!value → negates again, so you get a proper boolean.

    // value
    // It is the current field’s value that the test is running on.
    // Example: If you attach .test() to email, then value = whatever the user typed into email.

    //🔹 this.parent
    // It is the entire object that contains the current field (the sibling fields included).
    // This lets you compare values across fields.
    //}
    //)
    // const testData1 = { phoneNumber: "9876543210" }; // valid
    // const testData2 = { phoneNumber: "abc123" };     // invalid
    // const testData3 = { phoneNumber: null };         // valid
    // const testData4 = {};                            // valid (not required)

    //   / ... / → regex literal in JavaScript.
    // ^ → start of string.
    // \d → a digit (0–9).
    // + → one or more of the preceding thing (here: digits).
    // $ → end of string. 

  }).test(     // .test(name, errorMessage, testFn) is syntax 
    "at-least-one",   //name → a unique string for this test (used internally by Yup).
    "Either email or phone number is required",   //errorMessage → message shown if validation fails.
    function (value) {   //testFn → function that gets the field’s current value and must return:
      // true → ✅ validation passes
      // false → ❌ validation fails (shows errorMessage)
      // or throw a ValidationError if you want more control
      return !!(value.phoneNumber || value.email)
    })
//shape({ ... }) Defines the structure (fields and rules) for the object. Inside shape, you provide validation rules for each property.

const otpValidationSchema = yup
  .object()
  .shape({
    otp: yup.string().length(6, "the otp should  excatly of 6 digits").required("Otp is required")
  })

const profileValidationSchema = yup
  .object()
  .shape({
    username: yup.string().required("Username is required "),
    agreed: yup.bool().oneOf([true], "you must agree to the term") //oneOf is a method used to specify that a value must be one of a set of allowed values. It’s often used for enums, select inputs, or boolean checks.
  })

const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
]

function Login() {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } = useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(avatars[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [showDropDown, setShowDropDown] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false)
  const {
    register: loginRegister,   //Purpose: Connects your input fields to React Hook Form.
    handleSubmit: handleLoginSubmit, //Purpose: Handles form submission and runs validation before calling your submit function.
    formState: { errors: loginErrors }  //Purpose: Keeps track of validation errors for each field.
  } = useForm({
    //useForm()
    // A hook from React Hook Form to handle form state and validation.
    // Returns several helpers like register, handleSubmit, formState, etc.

    resolver: yupResolver(loginValidationSchema)

    //resolver
    // resolver is how React Hook Form integrates with external validation libraries like Yup.
    // yupResolver converts your Yup schema into a format React Hook Form understands.
  })

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue  //Update a field value programmatically, outside of user typing.
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  })

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: ProfileErrors },
    watch  //Observe one or more fields’ values in real-time.
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  })


  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  const ProgressBar = ({ totalSteps = 3, theme }) => {
    const progress = Math.min((step / totalSteps) * 100, 100);

    return (
      <div
        className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}
        rounded-full h-2.5 mb-6`}
      >
        <div
          style={{ width: `${progress}%` }}
          className="bg-gradient-to-r from-[#25D366] to-[#075E54] h-2.5 rounded-full"
        />
      </div>
    );
  };

  // api 
  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === "success") {
          toast.info("OTP send to your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode, null);

        if (response.status === "success") {
          toast.info("OTP send to your phone number ");
          setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode });
          setStep(2);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to send OTP")
    } finally {
      setLoading(false);
    }
  }

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("Phone or Email data is missing")
      }
      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, userPhoneData.email, otpString)
      } else {
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, null, otp)
      }
      if (response.status === "success") {
        toast.success("OTP verify successfully!!");
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to whatsapp");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3)
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file))// create url for preview
    }
  }

  const otpHandleChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp)
    setOtpValue("otp", newOtp.join(""))
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleBack = () => {
    setStep(1)
    setPhoneNumber(null)
    setOtp(["", "", "", "", "", ""])
    setError("")
  }

  const onProfileSetup = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();//FormData is a built-in JavaScript object that lets you construct a set of key-value pairs that can include both text fields and files.
      formData.append("username", data.username)
      formData.append("agreed", data.agreed)
      formData.append("about", data.about)
      
        console.log(profilePictureFile);
      if (profilePictureFile) {
        formData.append("media",profilePictureFile )// name is  media because in multer we have gave name is media
        //multer({ storage }).single("media")
      } else {
        formData.append("profilePicture", selectedAvatar)
      }
      await updateUserProfile(formData);

    
      toast.success("welcome back to whatsapp");
      navigate("/");
      resetLoginState();
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to update user profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden `}>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10 `}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3.2, type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
          >
            <FaWhatsapp className='w-16 h-16 text-white' />

          </motion.div>
          <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>whatApp Login</h1>
          <ProgressBar theme={"light"} />
          {error && <p className='text-red-500 text-center mb-4'>{error}</p>}


          {step === 1 && (
            <form
              className='space-y-4'
              onSubmit={handleLoginSubmit(onLoginSubmit)}
            >
              <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
                Enter Phone Number To Receive An OTP
              </p>
              <div className='relative'>
                <div className='flex'>
                  <div className='relative w-1/3'>
                    <button type='button' className={`flex-shrink-0 z-10  inline-flex items-center py-2.5  px-4 text-sm font-medium ${theme === "dark" ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg  focus:right-4 focus:outline-none focus:ring-gray-100 cursor-pointer`} onClick={() => setShowDropDown(!showDropDown)}>

                      <div className='flex justify-center items-center gap-2'>
                        <img src={selectedCountry.flag} />
                        {selectedCountry.dialCode}
                      </div>
                      <FaChevronDown className='ml-2' />
                    </button>
                    {showDropDown && (
                      <div className={`absolute z-10 w-min-[200px] mt-1 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} boder rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-hide`}>
                        <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2`}>
                          <input type="text" placeholder="Search contries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full px-2 py-1 border ${theme === "dark" ? "bg-gray-600 text-white border-gray-500" : "bg-white border-grap-300  rounded-md  focus:outline-none focus:ring"}
                          focus:right-2 focus:ring-green-500 
                          `}
                          ></input>
                        </div>
                        {filterCountries.map((country) =>
                          <button key={country.alpha2}
                            type='button'
                            className={`w-full text-left px-2 py-2  ${theme === "dark" ? "hover:bg-gray-600" :
                              "hover:bg-gray-300"
                              } focus:outline-none focus:bg-gray-500`}
                            onClick={() => {
                              setSelectedCountry(country)
                              setShowDropDown(false)
                              setSearchTerm("")
                            }}
                          >
                            <div className='flex justify-center items-center  break-all cursor-pointer text-sm'>
                              <img src={country.flag} ></img>
                              ({country.dialCode}){country.name}
                            </div>
                          </button>

                        )}
                      </div>
                    )}
                  </div>
                  <input type="text"
                    {...loginRegister("phoneNumber")}
                    value={phoneNumber} placeholder='Enter Phone No'
                    onChange={(e) => { setPhoneNumber(e.target.value) }}
                    className={`w-2/3 px-4 py-2 border ${theme === "dark" ? "bg-gray-700  border-gray-600 text-white " : "bg-white border-gray-300"} focus:right-2 focus:ring-green-500  rounded-md  focus:outline-none ${loginErrors.phoneNumber ? "border-red-500" : ""}`}>
                  </input>
                </div>
                {loginErrors.phoneNumber && (
                  <p className='text-red-500 text-sm'>{loginErrors.phoneNumber.message}</p>
                )}

              </div>
              {/* diverder with or  */}
              <div className='flex items-center my-4'>
                <div className='flex-grow h-px bg-gray-300 '></div>
                <span className='mx-3 text-gray-500 text-sm font-medium '>OR</span>
                <div className='flex-grow h-px bg-gray-300 '></div>
              </div>
              {/* Email input box */}
              <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-600"}`}>
                <FaUser className={`mr-2  text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                <input type="email"
                  {...loginRegister("email")}
                  value={email} placeholder='Email (OPTIONAL)'
                  onChange={(e) => { setEmail(e.target.value) }}
                  className={`w-full bg-transparent focus:outline-none  ${theme === "dark" ? " text-white " : "bg-black"}${loginErrors.email ? "border-red-500" : ""}`}>
                </input>
                {loginErrors.email && (
                  <p className='text-red-500 text-sm'>{loginErrors.email.message}</p>
                )}
              </div>
              <button type='submit' className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer'>
                {loading ? <Spinner /> : "Send OTP"}
              </button>

            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)}>
              <p className={`text-center ${theme === "drak" ? "text-gray-300" : "text-gray-600"} mb-4`}>Enter the 6-digit OTP send to your {userPhoneData ? userPhoneData.phoneSuffix : "Email"}{" "}
                {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
              </p>
              <div className='flex justify-between'>
                {otp.map((digit, index) => (
                  <input key={index}
                    id={`otp-${index}`}
                    type='text'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => otpHandleChange(index, e.target.value)}
                    className={`w-12 h-12 text-center border ${theme === "dark" ? "bg-gray-700 border-gray-600  text-white" : "bg-white border-gray-300"} rounded-md focus:ring-2 focus:ring-green-500${otpErrors.otp ? "border-red-500 " : ""}`}
                  />
                ))}
              </div>
              {otpErrors.otp && (
                <p className='text-red-500 text-sm'>{otpErrors.otp.message}</p>
              )}
              <button type='submit' className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition cursor-pointer mt-4'>
                {loading ? <Spinner /> : "Verify OTP"}
              </button>
              <button type='button'
                onClick={handleBack}
                className={` cursor-pointer mt-2 w-full ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700 "}py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center mt-2`}
              >
                <FaArrowLeft className='mr-2 ' />
                Wrong number?Go Back
              </button>
            </form>

          )}
          {step === 3 && (
            <form
              onSubmit={handleProfileSubmit(onProfileSetup)}
              className={`space-y-6 bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto ${theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
            >

              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-3">
                  <img
                    src={profilePicture || selectedAvatar}
                    alt="profile"
                    className="w-full h-full rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  />
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition"
                  >
                    <FaPlus className="w-4 h-4" />
                  </label>
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-gray-500 text-sm">Choose an avatar</p>
              </div>

              {/* Avatar Row */}
              <div className="flex justify-center gap-3 flex-wrap">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-1 rounded-full cursor-pointer hover:scale-110 transition ${selectedAvatar === avatar ? "ring-4 ring-green-500" : ""
                      }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Username Input */}
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...profileRegister("username")}
                  type="text"
                  placeholder="Username"
                  className="w-full pl-10 pr-3 py-2 border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                />
                {ProfileErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{ProfileErrors.username.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...profileRegister("agreed")}
                  className="rounded text-green-500 focus:ring-green-500"
                />
                <label className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-red-500 hover:underline">
                    Terms and Conditions
                  </a>
                </label>
              </div>
              {ProfileErrors.agreed && (
                <p className="text-red-500 text-sm">{ProfileErrors.agreed.message}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!watch("agreed") || loading}
                className={`w-full bg-green-500 text-white font-bold py-3 rounded-md hover:bg-green-600 transition duration-300 hover:scale-110 flex justify-center items-center text-lg cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {loading ? <Spinner /> : "Create Profile"}
              </button>
            </form>
          )}

        </motion.div>
      </div >

    </>
  )
}

export default Login 