'use client';

import SignInComponent from '@/components/SignIn';
import SignUpComponent from '@/components/SignUp';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, MicVocal, UserPlus } from 'lucide-react';
import { useState } from 'react';

const SignInPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-md mx-auto">
				<Card className="mb-4 py-6">
					<CardHeader className="gap-0">
						<div className="flex items-center justify-between">
							<CardTitle className="flex gap-2 items-center">
								<MicVocal className="w-5 h-5" />
								Fan Contest Hub
							</CardTitle>
						</div>
					</CardHeader>
				</Card>
				<Tabs
					value={activeTab}
					onValueChange={(value) => {
						setActiveTab(value as 'signin' | 'signup');
					}}
				>
					<TabsList className="grid w-full grid-cols-2 mb-1">
						<TabsTrigger value="signin">
							<LogIn className="w-4 h-4 mr-2" />
							Sign In
						</TabsTrigger>
						<TabsTrigger value="signup">
							<UserPlus className="w-4 h-4 mr-2" />
							Create Account
						</TabsTrigger>
					</TabsList>

					<TabsContent value="signin" className="space-y-4">
						<SignInComponent />
					</TabsContent>

					<TabsContent value="signup" className="space-y-4">
						<SignUpComponent />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default SignInPage;
