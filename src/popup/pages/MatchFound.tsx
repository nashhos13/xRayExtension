import React from 'react';
import { ImageSlide } from '../components/ImageSlide';
import { formatPrice } from '../utils';

interface MatchFoundProps {
    product: any;
    setView: (view: string) => void;
    renderedVariant: Record<string, any> | null;
    setVariant: (variant: Record<string, any>) => void;
    variantIndex: any;
}

export function MatchFound({ product, setView, renderedVariant, setVariant, variantIndex }: MatchFoundProps) {
    console.log("PRODUCT INFO: ", product);
    console.log("Current variant ++ ", renderedVariant);

    if (!renderedVariant) {
        return null;
    }

    let productState = renderedVariant;
    let masterKey = '';

    Object.entries(renderedVariant).forEach(([key, value]) => {
        const masterKeySnippet = key + ':' + (value as any)['id'] + ';';
        masterKey += masterKeySnippet;
    });

    const finalKey = masterKey.slice(0, -1);

    console.log("MASTER KEY: ", finalKey);
    console.log("TOTAL VARIANTS:", product.skus['variant_label_count']);

    const updateProductState = (select: React.ChangeEvent<HTMLSelectElement>) => {
        console.log("Option selected: ", select.target);
        console.log("Value selected: ", select.target.value);

        const variantChanged = select.target.id;
        const newVariant = select.target.value;
        const updatedProductState = { ...productState };

        const VARIANTS = product.skus.variant_labels;

        // Update productState with new value object of selected value.id
        for (const key in VARIANTS) {
            if (VARIANTS[key].id === variantChanged) {
                VARIANTS[key].values.forEach((value: any) => {
                    if (value.id === newVariant) {
                        updatedProductState[variantChanged] = value;
                    }
                });
            }
        }

        setVariant(updatedProductState);
        console.log("New Product State: ", updatedProductState);
    };

    // Check which variant contains img
    let imgDisplayed;
    for (const key in renderedVariant) {
        if ((renderedVariant[key] as any).hasOwnProperty('image')) {
            imgDisplayed = (renderedVariant[key] as any).image;
        }
    }

    product['selectedVariantID'] = finalKey;

    console.log("Current Variant info -----> ", product.skus.sku_index[finalKey]);

    let VARIANTS;
    let productIndex;
    let theirPrice;
    let sourcePrice;
    let diff;

    if (product.skus.variant_label_count === 0) {
        theirPrice = Number(product.their_price.slice(1));
        sourcePrice = Number(product.source_price.slice(1)).toFixed(2);

        return (
            <div id='MatchFoundPage' style={{ textAlign: 'center', width: '300px', background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)' }}>
                <h1 id="MatchFoundDisplay" style={{ marginBottom: '20px' }}>Potential Match Found!!!</h1>
                <div id="ImageSlideOne" style={{ display: 'flex', justifyContent: 'center', width: '80%', marginLeft: '10%' }}>
                    <ImageSlide productImages={product.matched_product_images} />
                </div>
                <div id='InfoSection' style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    padding: '5px',
                    marginTop: '5%',
                    marginBottom: '5%'
                }}>
                    <div id="ProductTitle" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ fontSize: '1.25em' }}>{product.matched_product_title}</h2>
                    </div>
                    <div id="PriceSector" style={{ display: 'flex' }}>
                        <div id='TheirPrice'>
                            <p>Their Price</p>
                            <h3>{formatPrice(theirPrice)}</h3>
                        </div>
                        <div id='SourcePrice' style={{ marginLeft: 'auto' }}>
                            <p>Source Price</p>
                            <h3>{formatPrice(sourcePrice)}</h3>
                        </div>
                    </div>
                    <h3 id="Savings">You Save --- <span style={{ color: 'green' }}>{formatPrice(theirPrice - Number(sourcePrice))}</span></h3>
                    <div id='ItemDetails' className='leftAlign'>
                        <ul>
                            <li>Detail 1</li>
                            <li>Detail 2</li>
                            <li>Detail 3</li>
                        </ul>
                    </div>
                </div>
                <div id='NextStepButtons'>
                    <>
                        <button id='MatchButton' style={{ color: 'white', backgroundColor: 'skyblue' }} onClick={() => setView('checkout')}>Match</button>
                        <button id='BuyAnywayButton' style={{ backgroundColor: '#616161' }} onClick={() => setView('checkout')}>Buy Anyway</button>
                    </>
                </div>
            </div>
        );
    }

    // With variants
    VARIANTS = product.skus.variant_labels;
    productIndex = product.skus.sku_index;
    theirPrice = Number(product.their_price.slice(1));
    sourcePrice = Number(productIndex[finalKey]['price']).toFixed(2);
    diff = (theirPrice - Number(sourcePrice)).toFixed(2);

    return (
        <div id='MatchFoundPage' style={{ textAlign: 'center', width: '300px', background: 'radial-gradient(100% 60% at 50% 0%, rgb(231, 243, 255) 0%, rgb(227, 231, 255) 1124%, rgb(243, 235, 253) 90%, rgb(252, 253, 255) 100%) no-repeat fixed, linear-gradient(rgb(229, 242, 250) 0%, rgb(250, 249, 254) 100%)' }}>
            <h1 id="MatchFoundDisplay" style={{ marginBottom: '20px' }}>Potential Match Found!!!</h1>
            <div id="ImageSlideOne" style={{ display: 'flex', justifyContent: 'center', width: '80%', marginLeft: '10%' }}>
                <img src={imgDisplayed} style={{ width: '80%' }} alt="Product variant" />
            </div>
            <div id='InfoSection' style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '5px',
                marginTop: '5%',
                marginBottom: '5%'
            }}>
                <div id="ProductTitle" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ fontSize: '1.25em' }}>{product.matched_product_title}</h2>

                    {product.skus['variant_label_count'] > 0 ? (
                        <div>
                            {Object.entries(VARIANTS).map(([variant, labels]: [string, any]) => (
                                <div key={labels['id']}>
                                    <span>{variant}:</span>
                                    <select id={labels['id']} onChange={updateProductState}>
                                        {labels['values'].map((value: any) => (
                                            <option key={value.id} value={value.id}>
                                                {value.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div id="PriceSector" style={{ display: 'flex' }}>
                    <div id='TheirPrice'>
                        <p>Their Price</p>
                        <h3>{formatPrice(product.their_price)}</h3>
                    </div>
                    <div id='SourcePrice' style={{ marginLeft: 'auto' }}>
                        <p>Source Price</p>
                        <h3>{formatPrice(sourcePrice)}</h3>
                    </div>
                </div>
                <h3 id="Savings">You Save --- <span style={{ color: 'green' }}>{formatPrice(diff)}</span></h3>
                <div id='ItemDetails' className='leftAlign'>
                    <ul>
                        <li>Detail 1</li>
                        <li>Detail 2</li>
                        <li>Detail 3</li>
                    </ul>
                </div>
            </div>
            <div id='NextStepButtons'>
                {product.skus.sku_index[finalKey]['quantity'] > 0 ? (
                    <>
                        <button id='MatchButton' style={{ color: 'white', backgroundColor: 'skyblue' }} onClick={() => setView('checkout')}>Match</button>
                        <button id='BuyAnywayButton' style={{ backgroundColor: '#616161' }} onClick={() => setView('checkout')}>Buy Anyway</button>
                    </>
                ) : <button style={{ background: 'red', color: 'white', marginBottom: '10px' }}>OUT OF STOCK</button>}
            </div>
        </div>
    );
}
