import { Sequelize } from 'sequelize'
import logger from './logger'

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './../data/database.sqlite',
    logging: (msg) => {
        if (msg.startsWith('Executing')) {
            logger.debug(msg);
        } else if (msg.startsWith('Executed')) {
            logger.info(msg);
        } else if (msg.startsWith('Error')) {
            logger.error(msg);
        } else {
            logger.verbose(msg);
        }
    }
})

export default sequelize