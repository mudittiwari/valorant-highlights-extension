import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {Logger} from "wxt";
import LoadingBar from './Loadingbar';
interface User {
  id: number;
  name: string;
}
const Login: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/auth/validate-token',{
          "token":token
        });
        if(response.status == 200){
          localStorage.setItem("documentation-user",JSON.stringify({...response.data,"selected-website-id":"","selected-website-name":"","selected-website-endpoints":[]}));
          console.log(localStorage.getItem("documentation-user"));
          navigate("/");
        }
        else if(response.status == 400){
          setError(response.data.message);
        }
      } catch (err) {
        setError('Please Enter Valid Token');
      }
      finally{
        setLoading(false);
      }
    } else {
      setError('Please enter a valid API token');
    }
  };

  return (
    <>
    {loading && <LoadingBar />}
    <div className="h-[600px] w-[600px] flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              API Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            {error && <h1 className='text-xs text-red-900'>{error}</h1>}
          </div>
          <button
            type="submit"

            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
    </>
  );
};

export default Login;