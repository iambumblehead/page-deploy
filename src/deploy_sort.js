// Filename: deploy_sort.js  
// Timestamp: 2017.08.13-14:31:48 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

export default (o => {

  o = (objarr, sortopts) =>
    o.sort(objarr, sortopts)

  o.greaterfirst = (objarr, prop) =>
    objarr.sort((obja, objb) => obja[prop] > objb[prop] ? -1 : 1)

  o.lesserfirst = (objarr, prop) => 
    objarr.sort((obja, objb) => obja[prop] > objb[prop] ? 1 : -1)

  o.sort = (objarr, sortopts) => {
    let { sorttype, propname } = sortopts || {},
        sortedarr = []

    if (!sorttype) {
      sortedarr = objarr.slice()
    } else if (sorttype === 'gtfirst') {
      sortedarr = o.greaterfirst(objarr, propname)
    } else if (sorttype === 'ltfirst') {
      sortedarr = o.lesserfirst(objarr, propname)
    }

    return sortedarr
  }

  return o
  
})({})
