"use server"

import * as C from '@/lib/constants';
import db from "@/lib/db";
import getSession from "@/lib/session";
import bcrypt from "bcrypt"
import { redirect } from "next/navigation";
import { z } from "zod";

const checkEmailExists = async(email: string) => {
    const user = await db.user.findUnique({
        where: { email },
        select: { id: true, }
    })
    return Boolean(user)
}

const formSchema = z.object({
    email: z
        .string().email().toLowerCase()
        .regex(C.EMAIL_REGAX, "이메일 주소를 정확하게 입력해주세요.")
        .refine( checkEmailExists, "존재하지 않는 이메일입니다."),
    username: z
        .string().min(C.USERNAME_MIN_LENGTH, C.USERNAME_MIN_LENGTH_ERROR),
    password: z
        .string()
        .min(C.PASSWORD_MIN_LENGTH, C.PASSWORD_MIN_LENGTH_ERROR)
        .refine( C.CHECK_PASSWORD, "비밀번호는 적어도 하나의 숫자를 포함해야 합니다."),
})

export async function login( prevState: any, formData: FormData){
    const data = {
        email: formData.get('email'),
        username: formData.get('username'),
        password: formData.get('password'),
    }
    const result = await formSchema.spa(data)
    
    if( !result.success ){
        return result.error.flatten()
    }else{
        const user = await db.user.findUnique({
            where: { email: result.data.email },
            select: { id: true, password: true }
        })

        const ok = await bcrypt.compare(result.data.password, user!.password ?? "")
        if( ok ){
            const session = await getSession();
            session.id = user!.id;
            await session.save();
            redirect('/')
        }else{
            return {
                fieldErrors: {
                    password: ["비밀번호를 정확하게 입력해주세요."],
                    username: [],
                    email: []
                }
            }
        }

       
    }

}