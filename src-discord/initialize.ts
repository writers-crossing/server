import { AwardXp, User, Sprint, WcEntry, GoalAudit } from './app/entities'

(async () => {
    await AwardXp.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })

    await GoalAudit.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })

    await User.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })

    await Sprint.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })

    await WcEntry.sync({
        force: false,
        alter: { drop: false },
        logging: (msg) => console.log(msg)
    })
    .then(() => console.info('Database initialized.'))
    .catch((error) => {
        console.error('Database synchronization failed:', error);
    })
})()