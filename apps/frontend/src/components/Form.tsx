
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useState } from 'react'
import {toast} from "sonner";
import axios from 'axios'
import { BACKEND_URL } from '@/lib/config';
import { useNavigate } from "react-router";


const Form = () => {
    const [gitHub, setGitHub] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const onSubmit = async ()=>{
        setLoading(true)
        try {
            if(!gitHub){
                toast.error("Please provide valid Github link",{
                    style: {
                        background: "#4f191f",
                        color: "#f04355",
                    },
                })
                return;
            }
            const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`,{
                    gitHub
                });
            navigate(`/interview/${response.data.interviewId}`)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(
                    error.response?.data?.message ||
                    "Failed to fetch repositories"
                );
            } else {
                toast.error("Unexpected error occurred");
            }
            setLoading(false)
        } 
            
    }
    return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
        <div>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                Kickstart AI interview
            </h2>
            </div>
            <div className="flex flex-col p-4 gap-4">
            <Input className="w" placeholder="GitHub URL" onChange={(e)=>setGitHub(e.target.value)}/>
            <div className="flex justify-center">
                <Button disabled={loading} onClick={onSubmit}>
                    Start Interview
                </Button>
            </div>
        </div>
    </div>
    );
}

export default Form