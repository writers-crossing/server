import { Sequelize } from 'sequelize'
import logger from './logger'
import config from '../data/config.json'

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.databaseAbsolutePath,
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