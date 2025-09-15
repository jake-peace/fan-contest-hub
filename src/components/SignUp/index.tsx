'use client'

import { Asterisk, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import z from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { confirmEmailOTP, signUpUser } from "@/utils/AuthUtils"
import { toast } from "sonner"
import { useAppDispatch } from "@/app/store/hooks"
import { setUser } from "@/app/store/reducers/userReducer"
import { useRouter } from "next/navigation"

const NewUserSchema = z.object({
    email: z.email(),
    nickname: z.string().min(3),
})

const SignUpComponent: React.FC = () => {

    const dispatch = useAppDispatch();
    const router = useRouter();

    const [signUpStage, setSignUpStage] = useState<'INITIAL' | 'OTP' | 'COMPLETE'>();
    const [otpValue, setOTPValue] = useState('');

    const form = useForm<z.infer<typeof NewUserSchema>>({
        resolver: zodResolver(NewUserSchema),
        defaultValues: {
            email: '',
            nickname: '',
        },
    })

    const handleSubmit = async (data: z.infer<typeof NewUserSchema>) => {
        const nextStep = await signUpUser(data.email, data.nickname)

        if (!nextStep) {
            toast.error(`Couldn't sign you up`)
        } else {
            toast.message('A one-time code has been sent to your email address')
            setSignUpStage('OTP');
        }
    };

    const onConfirmOTPCode = async () => {
        const { isSignUpComplete, userId } = await confirmEmailOTP(form.getValues('email'), otpValue);
        if (isSignUpComplete) {
            dispatch(setUser(userId as string))
            toast.success(`Signed up! User id: ${userId}`)
            router.push('/');
        } else {
            toast.error(`Couldn't sign you in :(`)
        }
    }

    if (signUpStage === 'OTP') {
        return (
            <Card className="mb-4 py-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Asterisk className="w-5 h-5" />
                            Enter One-Time Code
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="max-w-md mx-auto">
                    <InputOTP
                        maxLength={6}
                        value={otpValue}
                        onChange={(value) => setOTPValue(value)}
                        pattern={REGEXP_ONLY_DIGITS}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot className="border-black" index={0} />
                            <InputOTPSlot className="border-black" index={1} />
                            <InputOTPSlot className="border-black" index={2} />
                            <InputOTPSlot className="border-black" index={3} />
                            <InputOTPSlot className="border-black" index={4} />
                            <InputOTPSlot className="border-black" index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    <Button className="w-full mt-2" onClick={onConfirmOTPCode}>
                        Confirm
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mb-4 py-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Create an account
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name='email' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="example@email.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                    {`We don't use passwords! Sign up using your email and enter a one-time code every time you login.`}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}>
                        </FormField>

                        <FormField control={form.control} name='nickname' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="exec_supervisor_123" {...field} />
                                </FormControl>
                                <FormDescription>
                                    {`Be as creative as you want! This is the name that other users will see, so no personal information please.`}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}>
                        </FormField>

                        <Button type="submit" className="w-full">
                            Sign Up
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default SignUpComponent;