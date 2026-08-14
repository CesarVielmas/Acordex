import { PressEventItem } from '../models/press.models';

/**
 * Expedientes de firma y prensa con los que se prueba el apartado.
 *
 * Están en su propio archivo porque son datos, no lógica, y porque el store ya
 * pasa de las seis mil líneas. Lo que sí importa es qué casos cubren: cada uno
 * está puesto para que algo del apartado se pueda ver funcionando sin tener que
 * capturarlo a mano antes.
 *
 *   · **PRS-301** — Convocado, una sola disquera. El caso normal: acreditaciones
 *     aprobadas con gafete, dos solicitudes por revisar, una rechazada con motivo
 *     y **dos del mismo medio con correos distintos**, que es el duplicado que
 *     hoy nadie vería.
 *   · **PRS-302** — En Revisión, **dos disqueras**. Aquí es donde se ve el reparto
 *     de puntos obligatorios, la intervención y las propuestas: media lógica del
 *     apartado solo existe cuando hay alguien más.
 *   · **PRS-303** — Borrador casi vacío, de una sola disquera. Sirve para ver el
 *     checklist en rojo y la interfaz **sin nada de reparto**, que es como debe
 *     verse el caso de siempre.
 *   · **PRS-304** — Realizado. Asistencia marcada, gafetes usados y dos que no se
 *     presentaron: la diferencia entre acreditados y asistentes es el dato del
 *     que vive el cierre.
 */
export const INITIAL_PRESS_EVENTS: PressEventItem[] = [
  // ─── PRS-301 · Convocado · una sola disquera ────────────────────────────────
  {
    id: 'PRS-301',
    kind: 'prensa',
    title: 'Firma de Autógrafos y Lanzamiento de Disco',
    pressType: 'Firma de Autógrafos',
    date: '2026-08-22',
    startTime: '16:00',
    location: 'Monterrey, NL',
    venue: 'Plaza Fiesta San Agustín',
    venueAddress: 'Av. Real San Agustín 111, Residencial San Agustín, 66260 San Pedro Garza García, NL',
    groupName: 'Los Elegantes del Norte',
    disqueraId: 'acordex-records',
    state: 'Convocado',
    flyerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    description: 'Firma masiva de 1,000 autógrafos con pase de fotografía para fans acreditados.',
    createdBy: 'Don Raúl Treviño',
    createdAt: '2026-06-30T10:00',
    ownerManagerName: 'Don Raúl Treviño',

    publicProfile: {
      coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
      posterUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
      greetingVideos: [
        {
          id: 'gv-301-1',
          bandName: 'Los Elegantes del Norte',
          title: 'Invitación Oficial a la Firma',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          type: 'local'
        }
      ],
      category: 'Firma de Autógrafos',
      tagline: 'Meet & Greet y fotos con fans',
      about: 'Los Elegantes del Norte firmarán el nuevo disco y se tomarán fotografía con cada fan acreditado. '
        + 'Antes de la firma habrá un espacio breve para los medios acreditados, donde el grupo hablará del '
        + 'lanzamiento y de la gira que arranca en octubre.',
      rules: [
        { id: 'r-301-1', text: 'Indispensable portar la acreditación obtenida en la compra de boletos o el boleto oficial del concierto asociado.' },
        { id: 'r-301-2', text: 'Se firmará un artículo oficial por persona (CD, vinilo, póster o instrumento).' },
        { id: 'r-301-3', text: 'No se permiten selfies improvisadas: habrá un fotógrafo oficial del evento.' },
        { id: 'r-301-4', text: 'Las fotos oficiales se publican en Acordex 24 horas después del evento.' }
      ],
      minimumAge: 'Menores de 12 años acompañados de un adulto',
      supportPhone: '+52 (81) 1234 5678',
      supportWhatsApp: '528112345678',
      mapsQuery: 'Plaza Fiesta San Agustín, San Pedro Garza García, NL',
      guaranteeLabel: 'Acordex VIP'
    },

    lineup: [
      {
        id: 'sl-301-1',
        groupId: 'GRP-01',
        groupName: 'Los Elegantes del Norte',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        genre: 'Norteño / Banda',
        rating: 4.8,
        profileSlug: 'los-elegantes-del-norte',
        isExternal: false,
        managerName: 'Don Raúl Treviño',
        order: 1,
        isHeadliner: true,
        costItems: [],
        approval: 'No Requiere'
      }
    ],

    accreditation: {
      opensAt: '2026-07-15T09:00',
      closesAt: '2026-08-19T18:00',
      capacity: 25,
      zones: [
        { id: 'z-301-prensa', name: 'Sala de Prensa', description: 'Acceso al espacio de medios y a la mesa de entrevistas', capacity: 20 },
        { id: 'z-301-mesa', name: 'Mesa de Firmas', description: 'Acceso al frente de la mesa durante los primeros 10 minutos', capacity: 8 },
        { id: 'z-301-backstage', name: 'Backstage', description: 'Acceso al camerino antes del evento', capacity: 4 }
      ],
      pressKitUrl: 'presskit_elegantes_2026.pdf',
      pressKitName: 'Kit de Prensa · Los Elegantes 2026',
      allAccessLabel: 'ALL ACCESS',
      notes: 'Los medios con cámara deben avisar el equipo que ingresan al menos 24 h antes.'
    },

    accreditationRequests: [
      {
        id: 'ACR-301-01',
        eventId: 'PRS-301',
        applicantType: 'media',
        mediumName: 'El Norte',
        journalistName: 'Carlos Fuentes',
        email: 'cfuentes@elnorte.com',
        phone: '+52 81 8888 1111',
        cardId: 'CDP-88213',
        accredType: 'Prensa Escrita',
        crewSize: 2,
        equipmentNotes: 'Cámara réflex y grabadora de voz',
        status: 'approved',
        requestedAt: '2026-07-16T11:20',
        respondedAt: '2026-07-17T09:05',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'FRM-301-001',
        zones: ['z-301-prensa', 'z-301-mesa']
      },
      {
        id: 'ACR-301-02',
        eventId: 'PRS-301',
        applicantType: 'media',
        mediumName: 'Televisa Monterrey',
        journalistName: 'Adriana Lozano',
        email: 'alozano@televisamty.com',
        phone: '+52 81 8888 2222',
        cardId: 'CDP-77410',
        accredType: 'Televisión / Video',
        crewSize: 3,
        equipmentNotes: 'Cámara de hombro, trípode y micrófono de mano',
        status: 'approved',
        requestedAt: '2026-07-16T13:44',
        respondedAt: '2026-07-17T09:07',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'FRM-301-002',
        zones: ['z-301-prensa', 'z-301-mesa', 'z-301-backstage']
      },
      // Dos del mismo medio con correos distintos: el reportero y el fotógrafo
      // mandaron su solicitud por separado sin saberlo. No siempre es un error,
      // pero hay que verlo antes de aprobar dos gafetes que quizá sobran.
      {
        id: 'ACR-301-03',
        eventId: 'PRS-301',
        applicantType: 'media',
        mediumName: 'Multimedios Radio',
        journalistName: 'Iván Domínguez',
        email: 'ivan.dominguez@multimedios.com',
        phone: '+52 81 8888 3333',
        cardId: 'CDP-91002',
        accredType: 'Prensa Escrita',
        crewSize: 1,
        status: 'pending',
        requestedAt: '2026-08-02T18:10'
      },
      {
        id: 'ACR-301-04',
        eventId: 'PRS-301',
        applicantType: 'media',
        mediumName: 'Multimedios Radio',
        journalistName: 'Paola Reyna',
        email: 'preyna@multimedios.com',
        phone: '+52 81 8888 4444',
        cardId: 'CDP-91055',
        accredType: 'Fotografía Oficial',
        crewSize: 1,
        equipmentNotes: 'Dos cuerpos y lente 70-200',
        status: 'pending',
        requestedAt: '2026-08-03T09:32'
      },
      {
        id: 'ACR-301-05',
        eventId: 'PRS-301',
        applicantType: 'independent',
        mediumName: 'Corridos y Café (YouTube)',
        journalistName: 'Bruno Salcedo',
        email: 'brunosalcedo@gmail.com',
        cardId: 'INE-8291823',
        accredType: 'Prensa Digital / Creador',
        crewSize: 1,
        status: 'rejected',
        requestedAt: '2026-07-28T22:15',
        respondedAt: '2026-07-29T10:40',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        rejectionReason: 'El enlace al canal no está activo y no fue posible verificar coberturas previas. '
          + 'Vuelve a enviar la solicitud con el canal público y al menos dos coberturas del último año.'
      },
      {
        id: 'ACR-301-06',
        eventId: 'PRS-301',
        applicantType: 'independent',
        mediumName: 'La Banda al Día',
        journalistName: 'Rocío Espinoza',
        email: 'rocio@labandaaldia.mx',
        phone: '+52 81 8888 5555',
        cardId: 'INE-4410992',
        accredType: 'Prensa Digital / Creador',
        crewSize: 2,
        equipmentNotes: 'Teléfono con gimbal y micrófono de solapa',
        status: 'approved',
        requestedAt: '2026-07-30T08:05',
        respondedAt: '2026-07-30T17:20',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'FRM-301-003',
        zones: ['z-301-prensa']
      }
    ],

    stage: {
      setupKind: 'Mesa de Firmas',
      soundProvider: 'Audio Regio',
      soundContact: '+52 81 1122 3344',
      backdropUrl: 'https://images.unsplash.com/photo-1470229722913-7ea0d1e4ba24?w=800&auto=format&fit=crop&q=80',
      backdropSponsors: ['Acordex Records', 'Plaza Fiesta San Agustín', 'La Mejor FM'],
      queueStaffCount: 6,
      queueStaffLead: 'Luis Ibarra',
      securityProvider: 'Seguridad Delta',
      securityContact: '+52 81 5566 7788',
      notes: 'La fila entra por el acceso norte; los medios por el acceso de servicio.'
    },

    talent: {
      arrivalTime: '15:00',
      spokespersonName: 'Ramiro Cantú',
      spokespersonRole: 'Vocalista',
      committedMinutes: 120,
      bannedTopics: ['Separación del acordeonista anterior', 'Demanda con la disquera anterior'],
      notes: 'El grupo firma sentado; se retiran 15 min antes del cierre de la plaza.'
    },

    productionItems: [
      { id: 'pi-301-1', category: 'Mobiliario', concept: 'Mesa de firmas, mantel y 6 sillas', supplier: 'Renta Norte', amount: 4800, status: 'Contratado' },
      { id: 'pi-301-2', category: 'Audio', concept: 'Equipo de audio y operador', supplier: 'Audio Regio', amount: 12500, status: 'Contratado' },
      { id: 'pi-301-3', category: 'Escenario y Estructuras', concept: 'Backdrop impreso 4x3 con estructura', supplier: 'Gráfica MTY', amount: 9200, status: 'Pagado' },
      { id: 'pi-301-4', category: 'Personal y Staff', concept: '6 elementos de control de fila (6 h)', supplier: 'Staff Regio', amount: 7200, status: 'Cotizado' },
      { id: 'pi-301-5', category: 'Seguridad', concept: 'Seguridad privada para el grupo', supplier: 'Seguridad Delta', amount: 8500, status: 'Contratado' },
      { id: 'pi-301-6', category: 'Hospitalidad', concept: 'Café, agua y bocadillos para medios', supplier: 'Catering Doña Lupe', amount: 3600, status: 'Estimado' }
    ],

    convocation: {
      convokedAt: '2026-07-15T09:00',
      convokedBy: 'Don Raúl Treviño',
      publicUrl: '/events/firma-prensa?id=301',
      authorizedBy: 'Don Raúl Treviño'
    },

    timeline: [
      {
        id: 'tl-301-1', phaseNumber: 1, state: 'Borrador', phaseName: 'Armado del Evento',
        completedAt: '2026-06-30T10:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Se creó el borrador de la firma de autógrafos.'
      },
      {
        id: 'tl-301-2', phaseNumber: 2, state: 'En Revisión', phaseName: 'Revisión del Expediente',
        completedAt: '2026-07-10T12:30', actorName: 'Don Raúl Treviño',
        summaryNote: 'Expediente completo: montaje, zonas y cupo capturados.'
      },
      {
        id: 'tl-301-3', phaseNumber: 3, state: 'Convocado', phaseName: 'Convocatoria & Acreditación Abierta',
        completedAt: '2026-07-15T09:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'El evento salió al portal y se abrió el registro de acreditaciones.',
        snapshot: { requestsCount: 0, approvedCount: 0 }
      }
    ],

    evidenceMedia: [
      {
        id: 'evm-301-1', type: 'photo',
        url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
        caption: 'Los Elegantes del Norte en la sesión de fotos del disco',
        uploaderName: 'Sofía Ramírez', uploaderRole: 'administrador', uploadedAt: '2026-07-12 11:00', stage: 'Otro'
      },
      {
        id: 'evm-301-2', type: 'photo',
        url: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=600&auto=format&fit=crop&q=80',
        caption: 'Montaje de la mesa de firmas del año pasado, como referencia',
        uploaderName: 'Luis Ibarra', uploaderRole: 'usuario', uploadedAt: '2026-07-12 16:40', stage: 'Montaje'
      }
    ],

    activity: [
      {
        id: 'act-301-1', at: '2026-07-15T09:00',
        actor: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        channel: 'evento', kind: 'estado',
        summary: 'Don Raúl Treviño convocó el evento y abrió el registro de acreditaciones'
      }
    ]
  },

  // ─── PRS-302 · En Revisión · dos disqueras ──────────────────────────────────
  {
    id: 'PRS-302',
    kind: 'prensa',
    title: 'Rueda de Prensa Conexión Guadalajara',
    pressType: 'Rueda de Prensa',
    date: '2026-09-05',
    startTime: '11:00',
    location: 'Guadalajara, JAL',
    venue: 'Hotel Fiesta Americana Minerva',
    venueAddress: 'Av. Aurelio Ortega 764, Seattle, 45150 Zapopan, JAL',
    groupName: 'Grupo Dinastía Real',
    disqueraId: 'acordex-records',
    state: 'En Revisión',
    flyerUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80',
    description: 'Anuncio del álbum en co-producción y de la gira 2026.',
    createdBy: 'Don Raúl Treviño',
    createdAt: '2026-07-20T09:30',
    ownerManagerName: 'Don Raúl Treviño',

    publicProfile: {
      coverUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop&q=80',
      posterUrl: '',
      greetingVideos: [],
      category: 'Rueda de Prensa',
      tagline: 'Anuncio de álbum y gira 2026',
      about: 'Grupo Dinastía Real y Sierreño Music presentan en conjunto el álbum que grabaron este año y la gira '
        + 'que arranca en noviembre. Habrá espacio para preguntas de los medios acreditados y una sesión de '
        + 'fotografías con el grupo al terminar.',
      rules: [],
      supportPhone: '+52 (33) 3456 7890',
      supportWhatsApp: '',
      mapsQuery: 'Hotel Fiesta Americana Minerva, Zapopan, Jalisco'
    },

    lineup: [
      {
        id: 'sl-302-1',
        groupId: 'GRP-04',
        groupName: 'Grupo Dinastía Real',
        imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&auto=format&fit=crop&q=80',
        genre: 'Norteño / Banda',
        rating: 4.7,
        profileSlug: 'grupo-dinastia-real',
        isExternal: false,
        managerName: 'Don Raúl Treviño',
        order: 1,
        isHeadliner: true,
        costItems: [],
        approval: 'No Requiere'
      },
      {
        // Grupo de la otra disquera: su ficha pública la responde su dueño, así
        // que el punto obligatorio aparece a nombre de Beto Ramírez y no del
        // organizador. Es el caso que hace visible todo el reparto.
        id: 'sl-302-2',
        groupId: 'GRP-07',
        groupName: 'Los Herederos del Sur',
        imageUrl: '',
        genre: '',
        rating: 0,
        profileSlug: '',
        isExternal: true,
        engagementKind: 'coorganizacion',
        managerName: 'Beto Ramírez (Sierreño Music)',
        managerEmail: 'beto@sierrenomusic.com',
        order: 2,
        costItems: [],
        approval: 'Pendiente'
      }
    ],

    managerAgreements: [
      {
        id: 'ma-302-1', managerName: 'Don Raúl Treviño', role: 'organizador',
        settlementKind: 'fijo', fixedAmount: 0, status: 'Aceptado'
      },
      {
        id: 'ma-302-2', managerName: 'Beto Ramírez (Sierreño Music)', role: 'coorganizador',
        settlementKind: 'fijo', fixedAmount: 0, status: 'Aceptado',
        invitedAt: '2026-07-21T10:00', respondedAt: '2026-07-21T18:12',
        notes: 'Aporta al grupo invitado y la mitad del costo del salón.'
      }
    ],

    accreditation: {
      opensAt: '2026-08-10T09:00',
      capacity: 40,
      zones: [
        { id: 'z-302-sala', name: 'Sala de Prensa', description: 'Butacas frente al presídium', capacity: 35 },
        { id: 'z-302-foto', name: 'Foso de Fotógrafos', description: 'Franja frente al templete, primeros 5 minutos', capacity: 10 }
      ],
      allAccessLabel: 'ALL ACCESS'
    },

    accreditationRequests: [
      // Dos solicitudes con el MISMO correo: es la misma persona mandándola dos
      // veces porque no le llegó respuesta. Aprobar las dos manda dos gafetes a
      // la misma puerta.
      {
        id: 'ACR-302-01',
        eventId: 'PRS-302',
        applicantType: 'media',
        mediumName: 'Milenio Jalisco',
        journalistName: 'Héctor Ramos',
        email: 'hramos@milenio.com',
        phone: '+52 33 3111 2222',
        cardId: 'CDP-55120',
        accredType: 'Prensa Escrita',
        crewSize: 1,
        status: 'pending',
        requestedAt: '2026-08-11T10:15'
      },
      {
        id: 'ACR-302-02',
        eventId: 'PRS-302',
        applicantType: 'media',
        mediumName: 'Milenio Jalisco',
        journalistName: 'Héctor Ramos Chávez',
        email: 'hramos@milenio.com',
        phone: '+52 33 3111 2222',
        cardId: 'CDP-55120',
        accredType: 'Prensa Escrita',
        crewSize: 1,
        status: 'pending',
        requestedAt: '2026-08-12T08:02',
        internalNotes: 'Parece la misma solicitud del día anterior.'
      },
      {
        id: 'ACR-302-03',
        eventId: 'PRS-302',
        applicantType: 'media',
        mediumName: 'El Informador',
        journalistName: 'Lucía Navarro',
        email: 'lnavarro@informador.mx',
        cardId: 'CDP-60034',
        accredType: 'Fotografía Oficial',
        crewSize: 2,
        equipmentNotes: 'Dos cuerpos, lente 24-70 y 70-200',
        status: 'pending',
        requestedAt: '2026-08-12T17:40'
      },
      {
        id: 'ACR-302-04',
        eventId: 'PRS-302',
        applicantType: 'independent',
        mediumName: 'Sierreño Sessions',
        journalistName: 'Emilio Track',
        email: 'contacto@sierrenosessions.mx',
        cardId: 'INE-7723001',
        accredType: 'Prensa Digital / Creador',
        crewSize: 2,
        status: 'pending',
        requestedAt: '2026-08-13T21:05'
      }
    ],

    stage: {
      setupKind: 'Templete',
      soundProvider: '',
      soundContact: '',
      backdropUrl: '',
      backdropSponsors: [],
      securityProvider: 'Seguridad del Hotel',
      securityContact: '+52 33 3648 0000'
    },

    talent: {
      arrivalTime: '10:00',
      spokespersonName: '',
      committedMinutes: 45,
      bannedTopics: []
    },

    productionItems: [
      { id: 'pi-302-1', category: 'Recinto', concept: 'Salón Minerva A (4 h)', supplier: 'Fiesta Americana', amount: 18000, status: 'Contratado', assignedTo: 'Don Raúl Treviño' },
      { id: 'pi-302-2', category: 'Hospitalidad', concept: 'Café y canapés para 40 personas', supplier: 'Fiesta Americana', amount: 9500, status: 'Cotizado', assignedTo: 'Beto Ramírez (Sierreño Music)' }
    ],

    productionResponsibilities: [
      {
        id: 'pr-302-1', category: 'Audio', managerName: 'Beto Ramírez (Sierreño Music)',
        status: 'Pendiente', budgetCap: 15000,
        brief: 'Audio del salón con cuatro micrófonos de presídium y dos de mano para preguntas.',
        assignedAt: '2026-08-01T12:00'
      }
    ],

    tasks: [
      {
        // Punto obligatorio encargado a la otra disquera: es lo que hace que el
        // tag de la esquina diga "Beto Ramírez" en vez de "obligatorio · tuyo".
        id: 'task-302-sonido',
        kind: 'sistema',
        title: 'Sonido con responsable',
        checklistItemId: 'sonido_prensa',
        formSectionRef: 'montaje',
        assignedManager: 'Beto Ramírez (Sierreño Music)',
        status: 'asignada',
        priority: 'Alta',
        createdBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        createdAt: '2026-08-01T12:00',
        assignedAt: '2026-08-01T12:00'
      },
      {
        id: 'task-302-kit',
        kind: 'externa',
        title: 'Armar el kit de prensa con la portada del disco',
        detail: 'Boletín, tres fotografías en alta y las fechas de la gira.',
        assignedManager: 'Don Raúl Treviño',
        delegate: { name: 'Sofía Ramírez', rank: 'administrador' },
        status: 'aceptada',
        priority: 'Alta',
        dueDate: '2026-08-25',
        createdBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        createdAt: '2026-08-01T12:10'
      }
    ],

    timeline: [
      {
        id: 'tl-302-1', phaseNumber: 1, state: 'Borrador', phaseName: 'Armado del Evento',
        completedAt: '2026-07-20T09:30', actorName: 'Don Raúl Treviño',
        summaryNote: 'Se creó el borrador de la rueda de prensa.'
      },
      {
        id: 'tl-302-2', phaseNumber: 2, state: 'En Revisión', phaseName: 'Revisión del Expediente',
        completedAt: '2026-08-01T12:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Se mandó a revisión con Sierreño Music como co-organizador.'
      }
    ],

    evidenceMedia: [],

    activity: [
      {
        id: 'act-302-1', at: '2026-08-01T12:00',
        actor: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        channel: 'tareas', kind: 'asignacion',
        summary: 'Don Raúl Treviño le encargó el sonido a Beto Ramírez (Sierreño Music)'
      }
    ]
  },

  // ─── PRS-303 · Borrador · una sola disquera ─────────────────────────────────
  {
    id: 'PRS-303',
    kind: 'prensa',
    title: 'Firma de Autógrafos Nuevo Sencillo',
    pressType: 'Firma de Autógrafos',
    date: '2026-10-03',
    location: 'Saltillo, COAH',
    venue: 'Galerías Saltillo',
    groupName: 'Los Elegantes del Norte',
    disqueraId: 'acordex-records',
    state: 'Borrador',
    flyerUrl: '',
    createdBy: 'Don Raúl Treviño',
    createdAt: '2026-08-12T17:00',
    ownerManagerName: 'Don Raúl Treviño',

    lineup: [],
    accreditation: { zones: [], allAccessLabel: 'ALL ACCESS' },
    accreditationRequests: [],
    stage: { setupKind: 'Por Definir', backdropSponsors: [] },
    talent: { bannedTopics: [] },

    timeline: [
      {
        id: 'tl-303-1', phaseNumber: 1, state: 'Borrador', phaseName: 'Armado del Evento',
        completedAt: '2026-08-12T17:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Se creó el borrador de la firma.'
      }
    ],
    evidenceMedia: []
  },

  // ─── PRS-304 · Realizado · con asistencia marcada ───────────────────────────
  {
    id: 'PRS-304',
    kind: 'prensa',
    title: 'Rueda de Prensa Cierre de Gira 2026',
    pressType: 'Rueda de Prensa',
    date: '2026-08-02',
    startTime: '12:00',
    location: 'Monterrey, NL',
    venue: 'Auditorio Pabellón M',
    venueAddress: 'Av. Benito Juárez 1102, Centro, 64000 Monterrey, NL',
    groupName: 'Banda Los Reyes',
    disqueraId: 'acordex-records',
    state: 'Realizado',
    flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description: 'Balance de la gira y anuncio del documental.',
    createdBy: 'Don Raúl Treviño',
    createdAt: '2026-06-01T09:00',
    ownerManagerName: 'Don Raúl Treviño',

    publicProfile: {
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
      posterUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?w=800&auto=format&fit=crop&q=80',
      greetingVideos: [],
      category: 'Rueda de Prensa',
      tagline: 'Balance de gira y anuncio del documental',
      about: 'Banda Los Reyes cierra la gira 2026 con una rueda de prensa donde se presentó el documental grabado '
        + 'durante los últimos ocho meses. Se atendieron preguntas de los medios acreditados y hubo sesión de '
        + 'fotografías con el grupo completo.',
      rules: [
        { id: 'r-304-1', text: 'Acceso exclusivo para medios acreditados.' },
        { id: 'r-304-2', text: 'Registro de entrada 30 minutos antes.' },
        { id: 'r-304-3', text: 'Prohibido transmitir en vivo el material del documental.' }
      ],
      supportPhone: '+52 (81) 1234 5678',
      supportWhatsApp: '528112345678',
      mapsQuery: 'Auditorio Pabellón M, Monterrey'
    },

    lineup: [
      {
        id: 'sl-304-1',
        groupId: 'GRP-02',
        groupName: 'Banda Los Reyes',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        genre: 'Banda Sinaloense',
        rating: 4.9,
        profileSlug: 'banda-los-reyes',
        isExternal: false,
        managerName: 'Don Raúl Treviño',
        order: 1,
        isHeadliner: true,
        costItems: [],
        approval: 'No Requiere'
      }
    ],

    accreditation: {
      opensAt: '2026-07-01T09:00',
      closesAt: '2026-07-30T18:00',
      capacity: 30,
      zones: [
        { id: 'z-304-sala', name: 'Sala de Prensa', description: 'Butacas frente al presídium', capacity: 30 },
        { id: 'z-304-foto', name: 'Foso de Fotógrafos', description: 'Franja frente al templete', capacity: 8 }
      ],
      pressKitUrl: 'presskit_losreyes_cierre.pdf',
      pressKitName: 'Kit de Prensa · Cierre de Gira',
      allAccessLabel: 'ALL ACCESS'
    },

    accreditationRequests: [
      {
        id: 'ACR-304-01', eventId: 'PRS-304', applicantType: 'media',
        mediumName: 'El Norte', journalistName: 'Carlos Fuentes', email: 'cfuentes@elnorte.com',
        cardId: 'CDP-88213', accredType: 'Prensa Escrita', crewSize: 2,
        status: 'approved', requestedAt: '2026-07-05T10:00', respondedAt: '2026-07-05T15:20',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'RDP-304-001', zones: ['z-304-sala', 'z-304-foto'],
        attended: true, checkedInAt: '2026-08-02T11:32'
      },
      {
        id: 'ACR-304-02', eventId: 'PRS-304', applicantType: 'media',
        mediumName: 'Bandamax', journalistName: 'Ana Sofía Peña', email: 'apena@bandamax.tv',
        cardId: 'CDP-33091', accredType: 'Televisión / Video', crewSize: 3,
        status: 'approved', requestedAt: '2026-07-06T09:15', respondedAt: '2026-07-06T12:00',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'RDP-304-002', zones: ['z-304-sala', 'z-304-foto'],
        attended: true, checkedInAt: '2026-08-02T11:15'
      },
      {
        id: 'ACR-304-03', eventId: 'PRS-304', applicantType: 'independent',
        mediumName: 'Norteño Digital', journalistName: 'Jorge Elizondo', email: 'jorge@nortenodigital.mx',
        cardId: 'INE-2298471', accredType: 'Prensa Digital / Creador', crewSize: 1,
        status: 'approved', requestedAt: '2026-07-10T20:40', respondedAt: '2026-07-11T09:00',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'RDP-304-003', zones: ['z-304-sala'],
        attended: false
      },
      {
        id: 'ACR-304-04', eventId: 'PRS-304', applicantType: 'media',
        mediumName: 'Radio Fórmula MTY', journalistName: 'Beatriz Cuéllar', email: 'bcuellar@radioformula.mx',
        cardId: 'CDP-71223', accredType: 'Prensa Escrita', crewSize: 1,
        status: 'approved', requestedAt: '2026-07-12T11:00', respondedAt: '2026-07-12T14:30',
        respondedBy: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        badgeId: 'RDP-304-004', zones: ['z-304-sala'],
        attended: false
      }
    ],

    stage: {
      setupKind: 'Templete',
      soundProvider: 'Audio Regio',
      soundContact: '+52 81 1122 3344',
      backdropUrl: 'https://images.unsplash.com/photo-1470229722913-7ea0d1e4ba24?w=800&auto=format&fit=crop&q=80',
      backdropSponsors: ['Acordex Records', 'Pabellón M'],
      queueStaffCount: 2,
      queueStaffLead: 'Carlos Méndez',
      securityProvider: 'Seguridad Delta',
      securityContact: '+52 81 5566 7788'
    },

    talent: {
      arrivalTime: '11:00',
      spokespersonName: 'Ismael Reyes',
      spokespersonRole: 'Director musical',
      committedMinutes: 60,
      bannedTopics: ['Cambio de integrantes']
    },

    productionItems: [
      { id: 'pi-304-1', category: 'Recinto', concept: 'Sala de prensa Pabellón M (4 h)', supplier: 'Pabellón M', amount: 22000, status: 'Pagado' },
      { id: 'pi-304-2', category: 'Audio', concept: 'Audio y operador', supplier: 'Audio Regio', amount: 11000, status: 'Pagado' },
      { id: 'pi-304-3', category: 'Escenario y Estructuras', concept: 'Backdrop y templete', supplier: 'Gráfica MTY', amount: 14500, status: 'Pagado' },
      { id: 'pi-304-4', category: 'Hospitalidad', concept: 'Café y bocadillos', supplier: 'Catering Doña Lupe', amount: 5200, status: 'Pagado' }
    ],

    convocation: {
      convokedAt: '2026-07-01T09:00',
      convokedBy: 'Don Raúl Treviño',
      publicUrl: '/events/firma-prensa?id=304',
      authorizedBy: 'Don Raúl Treviño'
    },

    closure: {
      attendedCount: 2,
      publishedPieces: 5,
      estimatedReach: 180000,
      photosUploaded: 2,
      finalSpend: 52700,
      summary: 'Se acreditaron cuatro medios y llegaron dos. El documental se anunció sin filtraciones previas.',
      incidents: ['Dos medios acreditados no se presentaron y no avisaron.']
    },

    timeline: [
      {
        id: 'tl-304-1', phaseNumber: 1, state: 'Borrador', phaseName: 'Armado del Evento',
        completedAt: '2026-06-01T09:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Se creó el borrador de la rueda de prensa de cierre de gira.'
      },
      {
        id: 'tl-304-2', phaseNumber: 2, state: 'En Revisión', phaseName: 'Revisión del Expediente',
        completedAt: '2026-06-20T10:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Expediente completo y listo para convocar.'
      },
      {
        id: 'tl-304-3', phaseNumber: 3, state: 'Convocado', phaseName: 'Convocatoria & Acreditación Abierta',
        completedAt: '2026-07-01T09:00', actorName: 'Don Raúl Treviño',
        summaryNote: 'Registro abierto del 1 al 30 de julio.'
      },
      {
        id: 'tl-304-4', phaseNumber: 4, state: 'Realizado', phaseName: 'Evento Realizado',
        completedAt: '2026-08-03T00:05', actorName: 'sistema',
        summaryNote: 'El evento se celebró el 2026-08-02 y pasó a Realizado al día siguiente.',
        snapshot: { requestsCount: 4, approvedCount: 4, attendedCount: 2, spend: 52700 }
      }
    ],

    evidenceMedia: [
      {
        id: 'evm-304-1', type: 'photo',
        url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        caption: 'Presídium durante el anuncio del documental',
        uploaderName: 'Jorge Staff Ruiz', uploaderRole: 'usuario', uploadedAt: '2026-08-02 13:10', stage: 'Show'
      },
      {
        id: 'evm-304-2', type: 'photo',
        url: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=600&auto=format&fit=crop&q=80',
        caption: 'Sesión de fotos con los medios acreditados',
        uploaderName: 'Jorge Staff Ruiz', uploaderRole: 'usuario', uploadedAt: '2026-08-02 13:35', stage: 'Show'
      }
    ],

    activity: [
      {
        id: 'act-304-1', at: '2026-08-02T13:40',
        actor: { name: 'Don Raúl Treviño', managerName: 'Don Raúl Treviño', rank: 'manager' },
        channel: 'cierre', kind: 'edicion',
        summary: 'Don Raúl Treviño marcó la asistencia real de los medios acreditados'
      }
    ]
  }
];
