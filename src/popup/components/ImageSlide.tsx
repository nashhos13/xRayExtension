import React from 'react';
import Carousel from 'react-material-ui-carousel';
import * as Mui from '@mui/material';

interface ImageSlideProps {
    productImages: string[];
    indicators?: boolean;
    navButtonsVisible?: boolean;
}

export function ImageSlide({ productImages, indicators = false, navButtonsVisible = false }: ImageSlideProps) {
    return (
        <Carousel 
            indicators={indicators}
            interval={1500}
            navButtonsAlwaysInvisible={navButtonsVisible}
            sx={{
                width: {xs: '100%', sm: '90%', md: '80%'},
                mx: 'auto'
            }}
        >
            {
                productImages.map((img, index) => (
                    <Mui.Box
                        key={index}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <img 
                            className='receipt-image' 
                            src={img} 
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                            alt={`Product ${index + 1}`}
                        />
                    </Mui.Box>
                ))
            }
        </Carousel>
    );
}
