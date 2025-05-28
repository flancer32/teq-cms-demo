/**
 * CMS demo application backend server.
 * Configures and starts a web server with CMS template handling.
 * Supports Express and Fastify server types.
 */
export default class Fl32_Cms_Demo_Back_App {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:express')} express
     * @param {typeof import('node:fastify')} fastify
     * @param {typeof import('node:path')} path
     * @param {Fl32_Web_Back_Server_Config} configWeb
     * @param {Fl32_Web_Back_Dispatcher} dispatcher
     * @param {Fl32_Web_Back_Handler_Pre_Log} handRequestLog
     * @param {Fl32_Web_Back_Handler_Static} handStatic
     * @param {Fl32_Web_Back_Server} server
     * @param {Fl32_Cms_Back_Config} configCms
     * @param {Fl32_Cms_Back_Web_Handler_Template} handCmsTmpl
     */
    constructor(
        {
            'node:express': express,
            'node:fastify': fastify,
            'node:path': path,
            Fl32_Web_Back_Server_Config$: configWeb,
            Fl32_Web_Back_Dispatcher$: dispatcher,
            Fl32_Web_Back_Handler_Pre_Log$: handRequestLog,
            Fl32_Web_Back_Handler_Static$: handStatic,
            Fl32_Web_Back_Server$: server,
            Fl32_Cms_Back_Config$: configCms,
            Fl32_Cms_Back_Web_Handler_Template$: handCmsTmpl,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS
        const {default: Express} = express;
        const {default: Fastify} = fastify;
        const {join} = path;

        // MAIN
        /**
         * Starts the web server with configured handlers.
         * @param {object} args - Parameters object.
         * @param {string} args.root - Absolute path to app root folder
         * @returns {Promise<void>}
         */
        this.start = async function ({root}) {
            // FUNCS

            /**
             * Starts Express server.
             * @param {number} port
             * @param {Fl32_Web_Back_Dispatcher} dispatcher
             * @returns {Promise<void>}
             */
            async function startExpress(port, dispatcher) {
                const app = Express();

                app.use(async (req, res) => {
                    await dispatcher.onEventRequest(req, res);
                });

                return new Promise((resolve, reject) => {
                    app.listen(port, (err) => {
                        if (err) return reject(err);
                        resolve();
                        console.info(`Demo CMS is listening on port ${port} using 'express'...`);
                    });
                });
            }

            /**
             * Starts default server.
             * @param {number} port
             * @returns {Promise<void>}
             */
            async function startDefault(port) {
                const cfg = configWeb.create({port});
                await server.start(cfg);
            }

            /**
             * Starts Fastify server.
             * @param {number} port
             * @param {Fl32_Web_Back_Dispatcher} dispatcher
             * @returns {Promise<void>}
             */
            async function startFastify(port, dispatcher) {
                const fastify = Fastify();

                fastify.all('*', async (request, reply) => {
                    const req = request.raw;
                    const res = reply.raw;
                    await dispatcher.onEventRequest(req, res);
                });

                await fastify.listen({port});
                console.info(`Demo CMS is listening on port ${port} using 'fastify'...`);
            }

            // MAIN
            console.info('Demo CMS is starting...');
            try {
                configCms.init(
                    {
                        aiApiBaseUrl: process.env.TEQ_CMS_AI_API_BASE_URL,
                        aiApiKey: process.env.TEQ_CMS_AI_API_KEY,
                        aiApiModel: process.env.TEQ_CMS_AI_API_MODEL,
                        aiApiOrg: process.env.TEQ_CMS_AI_API_ORG,
                        localeAllowed: process.env.TEQ_CMS_LOCALE_ALLOWED.split(','),
                        localeBaseTranslate: process.env.TEQ_CMS_LOCALE_BASE_TRANSLATE,
                        localeBaseWeb: process.env.TEQ_CMS_LOCALE_BASE_DISPLAY,
                        rootPath: root,
                        tmplEngine: process.env.TEQ_CMS_TMPL_ENGINE,
                    }
                );
                const staticRoot = join(root, 'web');
                await handStatic.init({rootPath: staticRoot});
                dispatcher.addHandler(handCmsTmpl);
                dispatcher.addHandler(handRequestLog);
                dispatcher.addHandler(handStatic);
                dispatcher.orderHandlers();
                const port = process.env.SERVER_PORT || 3000;
                const type = process.env.SERVER_TYPE;
                switch (type) {
                    case 'express':
                        await startExpress(port, dispatcher);
                        break;
                    case 'fastify':
                        await startFastify(port, dispatcher);
                        break;
                    default:
                        await startDefault(port);
                }
            } catch (e) {
                console.error('The Demo CMS is crashed.', e);
            }
        };
    }
}