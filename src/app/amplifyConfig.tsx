'use client';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import amplifyOutputs from '../../amplify_outputs.json';
import { createContext, JSX, useContext } from 'react';
import { Schema } from '../../amplify/data/resource';

// 1. Configure Amplify
Amplify.configure(amplifyOutputs, { ssr: true });

// 2. Generate the client after configuring
const client = generateClient<Schema>({ authMode: 'userPool' });

// 3. Create a React context to provide the client
const AmplifyClientContext = createContext(client);

export function useAmplifyClient() {
    return useContext(AmplifyClientContext);
}

interface AmplifyConfigProps {
    children: JSX.Element;
}

export default function AmplifyConfig({ children }: AmplifyConfigProps) {
    return (
        <AmplifyClientContext.Provider value={client}>
            {children}
        </AmplifyClientContext.Provider>
    );
}