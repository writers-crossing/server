import { badgeIds } from './app/constants';
import sequelize, { Badge, Marathon } from './app/entities'

(async () => {
    await sequelize.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })

    // Seed Data
    await Badge.findOrCreate({
        where: { id: badgeIds.initial_11 },
        defaults: {
            id: badgeIds.initial_11,
            name: 'Initial 11 Badge',
            icon: '',
            hexdecimalColor: '000000',
            description: 'Given to the initial 11 users that submitted word count.',
            xp: 1
        }
    })

    await Badge.findOrCreate({
        where: { id: badgeIds.streak_7 },
        defaults: {
            id: badgeIds.streak_7,
            name: '7-day Streak',
            icon: '',
            hexdecimalColor: '000000',
            description: 'Given when you have hit your first 7-day streak.',
            xp: 1
        }
    })

    await Badge.findOrCreate({
        where: { id: badgeIds.nanowrimo_2023 },
        defaults: {
            id: badgeIds.nanowrimo_2023,
            name: 'NaNoWriMo 2023',
            icon: '',
            hexdecimalColor: '000000',
            description: 'Participated in NaNoWriMo 2023.',
            xp: 1
        }
    })

    await Marathon.findOrCreate({
        where: { id: badgeIds.nanowrimo_2023 },
        defaults: {
            id: 'bed24117-5e2e-41c2-a9c2-5639272174dd',
            name: 'NaNoWriMo 2023',
            slug: 'nanowrimo-2023',
            startTime: new Date(2023, 10, 1),
            endTime: new Date(2023, 10, 30, 11, 59, 99)
        }
    })
})()