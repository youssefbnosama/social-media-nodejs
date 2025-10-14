import bcrypt from "bcrypt";

export  const hashFunction =async (plain)=>{

   return await bcrypt.hash(plain,10)
}
export const compareHashing = async(plain,hashed)=>{
   return await bcrypt.compare(plain,hashed)
}