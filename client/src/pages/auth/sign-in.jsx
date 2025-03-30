import {
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "@/redux/apiCalls";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // ✅ Define error state
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ✅ Define navigate function

  const handleClick = async (e) => {
    e.preventDefault();
    try {
    const response = await login(dispatch, { email, password });
 

    if (response?.user) {
      navigate("/dashboard/profile"); // Redirect only if user exists
    } else {
      console.error("Login failed:", response);
      setError(response?.error || "An error occurred. Please try again."); // ✅ Set error state
    }
  } catch (error) {
    console.error("Login error:", error);
    setError("An error occurred. Please try again."); // ✅ Display error message
  }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your email and password to Sign In.
          </Typography>
        </div>
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your email
            </Typography>
            <Input
              size="lg"
              placeholder="name@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Password
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
          </div>

          {error && (  // ✅ Show error message if login fails
            <Typography variant="small" color="red" className="mt-2 text-center">
              {error}
            </Typography>
          )}

          <Button className="mt-6" fullWidth onClick={handleClick}>
            Sign In
          </Button>

          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Not registered?
            <Link to="/auth/sign-up" className="text-gray-900 ml-1">Create account</Link>
          </Typography>
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>
    </section>
  );
}

export default SignIn;
