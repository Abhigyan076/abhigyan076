import { TerminalIcon } from '@heroicons/react/outline';
import React, { useState } from 'react';
import Console from './console/Console';

export default () => {
    const [open, setOpen] = useState(false);

    return (
        <div className='fixed top-1/2 -translate-y-1/2 z-50 flex h-screen py-2 sm:py-4 gap-2 pointer-events-none right-0'>
            <div
                className='my-auto bg-gray-600 pointer-events-auto px-3 h-20 cursor-pointer rounded-component flex items-center justify-center'
                onClick={() => setOpen(!open)}
            >
                <TerminalIcon className='h-5 w-5' />
            </div>
            <div
                className={`duration-300 transform ${
                    open ? 'translate-x-0' : 'translate-x-full'
                } w-full sm:w-[24rem] md:w-[28rem] max-w-full bg-gray-700 h-full ${
                    open ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
            >
                <Console onClose={() => setOpen(false)} />
            </div>
        </div>
    );
};
