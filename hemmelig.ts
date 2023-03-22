const completionSpec: Fig.Spec = {
    name: 'hemmelig',
    description: 'Encrypt text',
    args: [
        {
            name: 'text',
            description: 'Text',
        },
    ],
    options: [
        {
            name: ['-t', '--title'],
            description: 'The secret title',
            isOptional: true,
            args: {
                name: 'title',
                description: 'The secret title',
            },
        },
        {
            name: ['-p', '--password'],
            description: 'The password to protect the secret',
            isOptional: true,
            args: {
                name: 'password',
                description: 'The password to protect the secret',
            },
        },
        {
            name: ['-l', '--lifetime'],
            description: 'The lifetime of the secret',
            isOptional: true,
            args: {
                name: 'lifetime',
                description: 'The lifetime of the secret',
            },
        },
        {
            name: ['-m', '--maxViews'],
            description: 'The max views of the secret',
            isOptional: true,
            args: {
                name: 'maxViews',
                description: 'The max views of the secret',
            },
        },
        {
            name: ['-c', '--cidr'],
            description: 'Provide the IP or CIDR range',
            isOptional: true,
            args: {
                name: 'cidr',
                description: 'Provide the IP or CIDR range',
            },
        },
        {
            name: ['-e', '--expire'],
            description: 'Burn the secret only after the expire time',
            isOptional: true,
            args: {
                name: 'expire',
                description: 'Burn the secret only after the expire time',
            },
        },
        {
            name: ['-u', '--url'],
            description: 'If you have your own instance of the Hemmelig.app',
            isOptional: true,
            args: {
                name: 'url',
                description: 'If you have your own instance of the Hemmelig.app',
            },
        },
        {
            name: ['-o', '--output'],
            description: 'Do you want the output response in yaml or json',
            isOptional: true,
            args: {
                name: 'output',
                description: 'Do you want the output response in yaml or json',
            },
        },
        {
            name: '--help',
            description: 'Prints help information',
            isOptional: true,
        },
    ],
};
export default completionSpec;
