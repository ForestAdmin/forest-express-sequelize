import ResourcesRemover from './resources-remover';

/**
 * Kept for retro-compatibility with forest-express.
 */
class ResourceRemover {
  constructor(model, params) {
    this.remover = new ResourcesRemover(model, [params.recordId]);
  }

  perform() {
    return this.remover.perform();
  }
}

module.exports = ResourceRemover;
