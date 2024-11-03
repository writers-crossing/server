export function formatWc(wc: number) {
    const nf = new Intl.NumberFormat()
    return nf.format(wc)
}

export async function waitMinutes(x: number) {
    const milliseconds = x * 60 * 1000;

    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    })
}