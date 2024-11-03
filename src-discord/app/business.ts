import { faker } from '@faker-js/faker'

export function toPascalCase(str: string) {
    return str
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export function getMonthName(date: Date) {
    const months = ["January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"]

    return months[date.getMonth()];
}

export function getSprintTheme() {
    return toPascalCase(`${faker.word.adjective()} ${faker.animal.type()}`)
}

export function getRandomPrompt() {
    const x = Math.floor(Math.random() * 5) + 1;

    if (x == 1) return `The ${faker.animal.type()} who went to ${faker.address.country()} to visit their ${faker.name.jobTitle()} named ${faker.name.firstName()}.`
    if (x == 2) return `A ${faker.animal.dog()} named ${faker.name.firstName()} that had a friend -- a ${faker.animal.type()} called ${faker.name.firstName()}.`
    if (x == 3) return `A ${faker.animal.type()} that finally achieved their dream of becoming a ${faker.name.jobTitle()}.`
    if (x == 4) return `A ${faker.animal.type()} signs up to a new chatroom service with the username of ${faker.internet.userName()}.`
    if (x == 5) return `A ${faker.animal.type()} wakes up -- in the year ${new Date(faker.date.future()).getFullYear()}!`
    else return `You saw a cute ${faker.animal.dog()} at the park.`
}

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