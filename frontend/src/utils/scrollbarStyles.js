export const scrollbarStyles = `
    [&::-webkit-scrollbar]:w-3

    [&::-webkit-scrollbar-track]:bg-[var(--scrollbar-track-color)]
    [&::-webkit-scrollbar-track]:rounded-full
    
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-thumb-color)]
    [&::-webkit-scrollbar-thumb]:border-1
    [&::-webkit-scrollbar-thumb]:border-[var(--scrollbar-track-color)]
    [&::-webkit-scrollbar-thumb]:border-solid

    supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-width:thin]
    supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-color:var(--scrollbar-thumb-color)_var(--scrollbar-track-color)]
`;