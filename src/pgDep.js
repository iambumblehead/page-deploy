import pgNodeDesign from './pgNodeDesign.js'
import pgReql from './pgReql.js'

const pg = {
  creator: pgNodeDesign
}

export default Object.assign(pgReql, pg)
