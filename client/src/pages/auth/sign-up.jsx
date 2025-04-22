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

// zod
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define the schema for form validation
const signUpSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  vehicle: z.string()
    .max(20, "Vehicle number must be less than 20 characters"),

  contact: z.string()
    .min(10, "Contact number must be at least 10 characters")
    .max(15, "Contact number must be less than 15 characters")
    .regex(/[0-9]/, "Password must contain at number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      vehicle: "",
      contact: "",
    },
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (formData) => {
    // e.preventDefault();
    setServerError("");

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
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg sm:w-1/2" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col space-y-4">
            <div>
              <Input
                size="lg"
                placeholder="First Name"
                {...register("firstName")}
                error={!!errors.firstName}
              />
              {errors.firstName && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.firstName.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                placeholder="Last Name"
                {...register("lastName")}
                error={!!errors.lastName}
              />
              {errors.lastName && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.lastName.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                type="email"
                placeholder="Email"
                {...register("email")}
                error={!!errors.email}
              />
              {errors.email && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.email.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                type="password"
                placeholder="Password"
                {...register("password")}
                error={!!errors.password}
              />
              {errors.password && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.password.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                type="password"
                placeholder="Confirm Password"
                {...register("confirmPassword")}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.confirmPassword.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                placeholder="Vehicle No "
                {...register("vehicle")}
                error={!!errors.vehicle}
              />
              {errors.vehicle && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.vehicle.message}
                </Typography>
              )}
            </div>

            <div>
              <Input
                size="lg"
                placeholder="Contact No  "
                {...register("contact")}
                error={!!errors.contact}
              />
              {errors.contact && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.contact.message}
                </Typography>
              )}
            </div>
          </div>

          {serverError && (
            <Typography variant="small" className="text-red-500 mt-2">
              {serverError}
            </Typography>
          )}

          <div className="mt-4">
            <Checkbox
              {...register("terms", { required: "You must accept the terms and conditions" })}
              label={
                <Typography variant="small" color="gray" className="flex items-center font-medium">
                  I agree to the&nbsp;
                  <a href="#" className="font-normal text-black transition-colors hover:text-gray-900 underline">
                    Terms and Conditions
                  </a>
                </Typography>
              }
              error={!!errors.terms}
            />
            {errors.terms && (
              <Typography variant="small" color="red" className="mt-1">
                {errors.terms.message}
              </Typography>
            )}
          </div>

          <Button
            type="submit"
            className="mt-4"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
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
