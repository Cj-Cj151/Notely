
const restify = require('restify');
const prisma = require('./lib/prisma');

const server = restify.createServer({
    name: 'notes-management-api'
});

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

const NOTE_CATEGORIES = new Set(['GENERAL', 'JOURNAL', 'RESEARCH', 'DRAFT']);

function parseNoteId(rawId) {
    if (typeof rawId !== 'string' || !/^\d+$/.test(rawId)) {
        return null;
    }

    const id = Number(rawId);
    return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

function sendInvalidId(res) {
    return res.send(400, {
        success: false,
        message: 'id must be a positive integer.'
    });
}

async function updateNoteProperties(id, data, res, operation) {
    try {
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote) {
            return res.send(404, {
                success: false,
                message: 'Note not found.'
            });
        }

        const note = await prisma.note.update({
            where: { id },
            data
        });

        return res.send(200, {
            success: true,
            note
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.send(404, {
                success: false,
                message: 'Note not found.'
            });
        }

        console.error(`${operation} failed:`, error.code || error.name || 'Unknown error');
        return res.send(500, {
            success: false,
            message: 'Failed to update note.'
        });
    }
}

server.get('/', (req, res, next) => {
    res.send({
        message: 'Notes Management API is running with Nodemon!'
    });

    return next();
});

server.get('/api/notes', async (req, res) => {
    const { view, category } = req.query || {};

    if (view !== undefined && view !== 'favorites' && view !== 'archive') {
        return res.send(400, {
            success: false,
            message: 'view must be favorites or archive.'
        });
    }

    if (category !== undefined && !NOTE_CATEGORIES.has(category)) {
        return res.send(400, {
            success: false,
            message: 'category must be GENERAL, JOURNAL, RESEARCH, or DRAFT.'
        });
    }

    const where = {
        isArchived: view === 'archive'
    };

    if (view === 'favorites') {
        where.isFavorite = true;
    }
    if (category !== undefined) {
        where.category = category;
    }

    try {
        const notes = await prisma.note.findMany({
            where,
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.send(200, {
            success: true,
            notes
        });
    } catch (error) {
        console.error('GET /api/notes failed:', error.code || error.name || 'Unknown error');
        res.send(500, {
            success: false,
            message: 'Failed to retrieve notes.'
        });
    }
});

server.get('/api/notes/:id', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    try {
        const note = await prisma.note.findUnique({
            where: { id }
        });

        if (!note) {
            return res.send(404, {
                success: false,
                message: 'Note not found.'
            });
        }

        return res.send(200, {
            success: true,
            note
        });
    } catch (error) {
        console.error('GET /api/notes/:id failed:', error.code || error.name || 'Unknown error');
        return res.send(500, {
            success: false,
            message: 'Failed to retrieve note.'
        });
    }
});

server.put('/api/notes/:id', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    const body = req.body || {};
    const data = {};
    const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);

    if (hasField('title')) {
        if (typeof body.title !== 'string' || body.title.trim().length === 0) {
            return res.send(400, {
                success: false,
                message: 'title must be a non-empty string.'
            });
        }
        if (Array.from(body.title).length > 255) {
            return res.send(400, {
                success: false,
                message: 'title must be 255 characters or fewer.'
            });
        }
        data.title = body.title;
    }

    if (hasField('content')) {
        if (typeof body.content !== 'string' || body.content.trim().length === 0) {
            return res.send(400, {
                success: false,
                message: 'content must be a non-empty string.'
            });
        }
        data.content = body.content;
    }

    if (hasField('category')) {
        if (typeof body.category !== 'string' || !NOTE_CATEGORIES.has(body.category)) {
            return res.send(400, {
                success: false,
                message: 'category must be GENERAL, JOURNAL, RESEARCH, or DRAFT.'
            });
        }
        data.category = body.category;
    }

    for (const field of ['isFavorite', 'isArchived']) {
        if (hasField(field)) {
            if (typeof body[field] !== 'boolean') {
                return res.send(400, {
                    success: false,
                    message: `${field} must be a boolean.`
                });
            }
            data[field] = body[field];
        }
    }

    if (Object.keys(data).length === 0) {
        return res.send(400, {
            success: false,
            message: 'At least one supported note property is required.'
        });
    }

    return updateNoteProperties(id, data, res, 'PUT /api/notes/:id');
});

server.del('/api/notes/:id', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    try {
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote) {
            return res.send(404, {
                success: false,
                message: 'Note not found.'
            });
        }

        await prisma.note.delete({
            where: { id }
        });

        return res.send(200, {
            success: true,
            message: 'Note deleted successfully.'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.send(404, {
                success: false,
                message: 'Note not found.'
            });
        }

        console.error('DELETE /api/notes/:id failed:', error.code || error.name || 'Unknown error');
        return res.send(500, {
            success: false,
            message: 'Failed to delete note.'
        });
    }
});

server.post('/api/notes', async (req, res) => {
    const body = req.body || {};
    const { title, content, category = 'GENERAL' } = body;

    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.send(400, {
            success: false,
            message: 'title is required and must be a non-empty string.'
        });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
        return res.send(400, {
            success: false,
            message: 'content is required and must be a non-empty string.'
        });
    }

    if (Array.from(title).length > 255) {
        return res.send(400, {
            success: false,
            message: 'title must be 255 characters or fewer.'
        });
    }

    if (typeof category !== 'string' || !NOTE_CATEGORIES.has(category)) {
        return res.send(400, {
            success: false,
            message: 'category must be GENERAL, JOURNAL, RESEARCH, or DRAFT.'
        });
    }

    try {
        const note = await prisma.note.create({
            data: {
                title,
                content,
                category
            }
        });

        return res.send(201, {
            success: true,
            note
        });
    } catch (error) {
        console.error('POST /api/notes failed:', error.code || error.name || 'Unknown error');
        return res.send(500, {
            success: false,
            message: 'Failed to create note.'
        });
    }
});

server.put('/api/notes/:id/favorite', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    const { isFavorite } = req.body || {};
    if (typeof isFavorite !== 'boolean') {
        return res.send(400, {
            success: false,
            message: 'isFavorite must be a boolean.'
        });
    }

    return updateNoteProperties(id, { isFavorite }, res, 'PUT /api/notes/:id/favorite');
});

server.put('/api/notes/:id/archive', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    return updateNoteProperties(id, { isArchived: true }, res, 'PUT /api/notes/:id/archive');
});

server.put('/api/notes/:id/restore', async (req, res) => {
    const id = parseNoteId(req.params.id);
    if (id === null) {
        return sendInvalidId(res);
    }

    return updateNoteProperties(id, { isArchived: false }, res, 'PUT /api/notes/:id/restore');
});

server.listen(Number(process.env.PORT) || 3000, () => {
    console.log(`Server running at http://localhost:${Number(process.env.PORT) || 3000}`);
});
