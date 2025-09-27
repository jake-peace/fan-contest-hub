import { confirmSignIn, confirmSignUp, getCurrentUser, signIn, signUp } from 'aws-amplify/auth';

export const signUpUser = async (email: string, nick: string) => {
	const { nextStep } = await signUp({
		username: email,
		options: {
			userAttributes: {
				nickname: nick,
			},
		},
	});

	return nextStep.signUpStep;
};

export const confirmEmailOTP = async (email: string, otp: string) => {
	const { isSignUpComplete, userId } = await confirmSignUp({
		username: email,
		confirmationCode: otp,
	});
	return { isSignUpComplete, userId };
};

export const isLoggedIn = async () => {
	const response = await getCurrentUser();
	return response;
};

export const signInUser = async (email: string) => {
	const { nextStep: signInNextStep } = await signIn({
		username: email,
		options: {
			authFlowType: 'USER_AUTH',
			preferredChallenge: 'EMAIL_OTP',
		},
	});
	if (signInNextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_FIRST_FACTOR_SELECTION') {
		throw new Error();
	}
	return signInNextStep.signInStep;
};

export const confirmEmailOTPSignIn = async (otp: string) => {
	const { nextStep } = await confirmSignIn({
		challengeResponse: otp,
	});
	return nextStep.signInStep;
};
