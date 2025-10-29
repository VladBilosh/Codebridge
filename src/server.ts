import { CommonEngine } from '@angular/ssr/node';
import { render } from '@netlify/angular-runtime/common-engine.mjs';

const engine = new CommonEngine({});

export default render.bind(null, engine);
