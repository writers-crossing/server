import { badgeIds } from './app/constants';
import sequelize, { Badge } from './app/entities'

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
            description: 'Given to the initial 11 users that submitted word count.',
            xp: 1
        }
    })

    await Badge.findOrCreate({
        where: { id: badgeIds.streak_7 },
        defaults: {
            id: badgeIds.streak_7,
            name: '7-day Streak',
            description: 'Given when you have hit your first 7-day streak.',
            xp: 1
        }
    })
})()