// Filename: deploy_sort.js  
// Timestamp: 2017.08.13-14:31:48 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const greaterfirst = (objarr, prop) => (
  objarr.sort((obja, objb) => obja[prop] > objb[prop] ? -1 : 1))

const lesserfirst = (objarr, prop) => (
  objarr.sort((obja, objb) => obja[prop] > objb[prop] ? 1 : -1))

const sort = (objarr, sortopts) => {
  let { sorttype, propname } = sortopts || {},
      sortedarr = []

  if (!sorttype) {
    sortedarr = objarr.slice()
  } else if (sorttype === 'gtfirst') {
    sortedarr = greaterfirst(objarr, propname)
  } else if (sorttype === 'ltfirst') {
    sortedarr = lesserfirst(objarr, propname)
  }

  return sortedarr
}

export default Object.assign(sort, {
  greaterfirst,
  lesserfirst
})
