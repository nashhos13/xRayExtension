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
                width: '200px', 
                top: '165px', 
                right: '25px', 
                height: '200px', 
                justifyContent: 'center', 
                background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)'
            }}
        >
            <h1>Sorry!!! You Must Sign Up Here!!!!!: <br /></h1>
            <a href='https://tryxray.ai'>Join xRay</a>
        </div>
    );
}
