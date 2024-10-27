const Parameter = require('./models/parameter');

// Función para eliminar acentos
module.exports.normalizeString = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// Get all categories so it is not necessary to retrieve them for every view.
module.exports.retrieveCategories = async () => {
    try {
        const result = await Parameter.findOne({ categories: { $exists: true } });
        return result.categories;
    } catch {
        console.error('No se han podido obtener las categorías.')
        return null;
    }
}