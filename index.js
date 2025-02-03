const {koaApp, init} = require('./koaApp');
const PORT = process.env.PORT || 80

if(process.env.PLATFORM == 'FAAS') { // Set this ENV in FAAS to make it work
    exports.handler = koaApp.callback();
    exports.initializer = init;
} else { 
    init();
    koaApp.listen(PORT, '0.0.0.0', () => {
        console.log('Server is listening on IPv4 interfaces Only');
    }); 
} 