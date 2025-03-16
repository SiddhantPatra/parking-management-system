import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login, signup } from "../../redux/apiCalls";

export function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    vehicle: "",
    contact: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await signup(dispatch, formData); // Await the API call
      // console.log("Signup API Response:", response);
      if (response && response.success) {  // ✅ Check for success key
        // Automatically log the user in after signup
        const { email, password } = formData;
        // console.log("Attempting Automatic Login with:", { email, password });

        const loginResponse = await login(dispatch, { email, password });
        // console.log("Login API Response:", loginResponse);

        if (loginResponse && loginResponse.success) {
          navigate('/dashboard/profile'); // Redirect to profile page
        } else {
          setError("Automatic login failed. Please log in manually.");
          navigate('/auth/sign-in'); // Redirect to login page
        }
        // navigate('/dashboard/profile');
      } else {
        setError(response?.message || "Signup failed. Please try again.");
      }

    } catch (error) {
      console.error("Signup Error:", error);
      setError("Signup error, please try again.");
    }


  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover" alt="Pattern" />
      </div>
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            Join Us Today
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your details to register.
          </Typography>
        </div>
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg sm:w-1/2" onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4">
            <Input size="lg" placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <Input size="lg" placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <Input size="lg" type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required />
            <Input size="lg" type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required />
            <Input size="lg" type="password" placeholder="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            <Input size="lg" placeholder="Vehicle No (Optional)" name="vehicle" value={formData.vehicle} onChange={handleChange} />
            <Input size="lg" placeholder="Contact No (Optional)" name="contact" value={formData.contact} onChange={handleChange} />
          </div>

          {error && <Typography variant="small" className="text-red-500 mt-2">{error}</Typography>}

          <Checkbox
            label={
              <Typography variant="small" color="gray" className="flex items-center font-medium">
                I agree to the&nbsp;
                <a href="#" className="font-normal text-black transition-colors hover:text-gray-900 underline">
                  Terms and Conditions
                </a>
              </Typography>
            }
            required
            containerProps={{ className: "-ml-3" }}
          />

          <Button type="submit" className="mt-4" fullWidth>
            Sign Up
          </Button>

          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Already have an account?
            <Link to="/auth/sign-in" className="text-gray-900 ml-1 font-semibold underline">
              Sign In
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
