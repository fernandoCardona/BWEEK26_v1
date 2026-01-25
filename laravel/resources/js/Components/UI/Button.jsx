import React from 'react';
import { Link } from '@inertiajs/react';

export default function Button({
    variant = 'primary',
    className = '',
    children,
    href,
    ...props
}) {
    const baseClass = "inline-flex items-center justify-center transition-all duration-300";

    const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        ghost: "px-8 py-4 bg-transparent text-white font-bold rounded-full hover:bg-white/5",
    };

    const combinedClass = `${baseClass} ${variants[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClass} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={combinedClass} {...props}>
            {children}
        </button>
    );
}
