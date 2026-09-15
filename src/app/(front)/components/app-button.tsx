'use client'

import { toast } from "react-toastify";

export default function AppButton() {
  
  const handleClickMe = () => toast('Hello Next.js');  

  return (
    <button onClick={handleClickMe} >
        Click Me!
    </button>
  );
}
