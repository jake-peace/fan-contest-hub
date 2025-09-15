'use client'

import { Asterisk, LogIn } from "lucide-react"
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
import { confirmEmailOTPSignIn, signInUser } from "@/utils/AuthUtils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Spinner } from "../ui/spinner"

const SignInSchema = z.object({
    email: z.email(),
})

const SignInComponent: React.FC = () => {
    const router = useRouter();

    const [signUpStage, setSignUpStage] = useState<'INITIAL' | 'OTP' | 'COMPLETE'>();
    const [otpValue, setOTPValue] = useState('');
    const [otpError, setOTPError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof SignInSchema>>({
        resolver: zodResolver(SignInSchema),
        defaultValues: {
            email: '',
        },
    })

    const handleSubmit = async (data: z.infer<typeof SignInSchema>) => {
        try {
            const nextStep = await signInUser(data.email)
            if (!nextStep) {
                toast.error(`Couldn't sign you in`)
            } else {
                toast.message('A one-time code has been sent to your email address')
                setSignUpStage('OTP');
            }
        } catch {
            toast.error('Account not found with that email, try creating a new account')
        }
    }

    const onConfirmOTPCode = async (otpCode?: string) => {
        setIsLoading(true);
        try {
            const nextStep = await confirmEmailOTPSignIn(otpCode ? otpCode : otpValue);
            if (nextStep === 'DONE') {
                toast.success(`Signed in!`)
                router.push('/');
            }
        } catch {
            setOTPError(true);
            toast.error('Something went wrong when checking OTP code.');
        }
        setIsLoading(false);
    }

    if (signUpStage === 'OTP') {
        return (
            <>
                <Card className="mb-4 py-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Asterisk className="w-5 h-5" />
                                Enter One-Time Code
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="justify-items-center max-w-md">
                        <InputOTP
                            maxLength={8}
                            value={otpValue}
                            onChange={(value) => {
                                setOTPValue(value)
                                if (value.length === 8) {
                                    onConfirmOTPCode(value);
                                }
                            }}
                            pattern={REGEXP_ONLY_DIGITS}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot className="border-black" index={0} />
                                <InputOTPSlot className="border-black" index={1} />
                                <InputOTPSlot className="border-black" index={2} />
                                <InputOTPSlot className="border-black" index={3} />
                                <InputOTPSlot className="border-black" index={4} />
                                <InputOTPSlot className="border-black" index={5} />
                                <InputOTPSlot className="border-black" index={6} />
                                <InputOTPSlot className="border-black" index={7} />
                            </InputOTPGroup>
                        </InputOTP>
                        {otpError && <p className="text-red-500">The one-time code you entered is incorrect.</p>}
                        <div className="mt-2">
                            <p className="text-muted-foreground text-sm">
                                Enter the one time code sent to your email.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Not got one? Wait 30 mins or try signing in on the previous screen.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </>
        )
    }

    if (isLoading) {
        return (
            <Spinner />
        )
    }

    return (
        <Card className="mb-4 py-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Sign In
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
                                    {`Enter your email to receive a one-time code to sign in.`}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}>
                        </FormField>

                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default SignInComponent;