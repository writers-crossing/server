import sequelize from './app/entities'

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
})()