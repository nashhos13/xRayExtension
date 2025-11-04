import React from 'react';

interface ProductProfileProps {
    title: string;
    price: string[];
}

export function ProductProfile({ title, price }: ProductProfileProps) {
    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '50%', width: '40%'}}>
            <h1>{title}</h1>
            <h2>Price Variations: {price.join(", ")}</h2>
        </div>
    );
}

interface ProductDescriptionProps {
    description: string[];
}

export function ProductDescription({ description }: ProductDescriptionProps) {
    return (
        <div style={{width: 'auto', margin: '0 10%'}}>
            <ul>
                {description.map((d, index) => (
                    <li key={index}>{d}</li>
                ))}
            </ul>
        </div>
    );
}

interface ProductFinePrintProps {
    details: Record<string, any>[];
    descriptions: string;
}

export function ProductFinePrint({ details, descriptions }: ProductFinePrintProps) {
    if (details.length > 0) {
        return (
            <div style={{width: 'auto', margin: '0 10%'}}>
                <h1 style={{textAlign: 'center'}}>Fine Print</h1>
                <ul>
                    {details.map((detail, index) => {
                        const [key, value] = Object.entries(detail)[0];
                        return <li key={index}>{key}: {String(value)}</li>;
                    })}
                </ul>
                <p>{descriptions}</p>
            </div>
        );
    }
    return null;
}

export function PurchaseButton() {
    return (
        <button style={{width: '250px', height: '85px', fontSize: '3em', fontFamily: 'Verdana'}}>
            Purchase
        </button>
    );
}

export function LoadingPage() {
    return (
        <div>
            <h1>Still Loading Product</h1>
        </div>
    );
}

export function SignUpRequired() {
    return (
        <div 
            id='SignUp_div' 
            style={{
                position: 'fixed', 
                top: '190px',
                right: '50px',
                width: '280px', 
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e0e7ff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 10000,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
        >
            <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
            }}>
                <span style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>X</span>
            </div>
            
            <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                lineHeight: '1.3'
            }}>
                Sign Up Required
            </h2>
            
            <p style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5'
            }}>
                Create your free xRay account to start finding better deals on Amazon products.
            </p>
            
            <a 
                href='https://tryxray.ai'
                style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                Join xRay - It's Free!
            </a>
            
            <p style={{
                margin: '16px 0 0 0',
                fontSize: '12px',
                color: '#9ca3af'
            }}>
                Already have an account? Visit tryxray.ai to sign in
            </p>
        </div>
    );
}
