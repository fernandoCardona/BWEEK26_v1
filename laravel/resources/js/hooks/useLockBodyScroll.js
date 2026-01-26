import { useEffect } from 'react';

const STATE_KEY = '__bweek_body_scroll_lock__';

export default function useLockBodyScroll(locked) {
    useEffect(() => {
        if (!locked) return;
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const state = (window[STATE_KEY] ||= {
            count: 0,
            overflow: null,
            paddingRight: null,
        });

        if (state.count === 0) {
            state.overflow = document.body.style.overflow;
            state.paddingRight = document.body.style.paddingRight;
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : state.paddingRight;
        }

        state.count += 1;

        return () => {
            state.count = Math.max(0, state.count - 1);
            if (state.count === 0) {
                document.body.style.overflow = state.overflow ?? '';
                document.body.style.paddingRight = state.paddingRight ?? '';
            }
        };
    }, [locked]);
}

