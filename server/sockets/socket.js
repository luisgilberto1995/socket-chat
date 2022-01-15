const { Usuarios } = require('../clases/usuarios');
const { io } = require('../server');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {
    
    client.on('entrarChat', (usuario, callback) => {
        console.log(usuario);

        if ( !usuario.nombre || !usuario.sala ) {
            return callback({
                error: true,
                mensaje: ' El nombre es necesario'
            })
        }

        client.join( usuario.sala );

        let personas = usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);
        client.broadcast.to( usuario.sala ).emit('crearMensaje', crearMensaje('Administrador', `${usuario.nombre} se unió`) );
        client.broadcast.to( usuario.sala ).emit('listaPersona', usuarios.getPersonasPorSala( usuario.sala ) ) ;

        callback(usuarios.getPersonasPorSala( usuario.sala ));
    });

    client.on('crearMensaje',
    ( data, callback ) => {
        //console.log("CrearMensaje de lado del servidor");
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje( persona.nombre, data.mensaje );
        client.broadcast.to( persona.sala ).emit( 'crearMensaje', mensaje );

        callback( mensaje );
    });

    client.on('disconnect',
    () => {
        //console.log("Borrando...", client.id);
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to( personaBorrada.sala ).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`) );
        client.broadcast.to( personaBorrada.sala ).emit('listaPersona', usuarios.getPersonasPorSala( personaBorrada.sala )) ;
    });

    client.on('mensajePrivado',
    ( data ) => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to( data.sala ).emit( 'mensajePrivado', crearMensaje( persona.nombre, data.mensaje ) );
    });

});