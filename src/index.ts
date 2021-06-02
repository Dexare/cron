import { DexareModule, DexareClient, BaseConfig, Util } from 'dexare';
import { join } from 'path';
import { CronJob, CronCommand, CronJobParameters } from 'cron';

export interface CronConfig extends BaseConfig {
  cron?: CronModuleOptions;
}

export interface CronModuleOptions {
  loadFolder?: string;
}

export type CronModuleCommand = CronCommand | ((client: DexareClient<any>, job: CronJob) => void);

export interface CronModuleJobParams extends Omit<CronJobParameters, 'context' | 'onTick' | 'onComplete'> {
  /**
   * The name of this cron job.
   */
  name: string;
  /**
   * The function to fire at the specified time. If an ```onComplete``` callback was provided, ```onTick``` will receive it as an argument. ```onTick``` may call ```onComplete``` when it has finished its work.
   */
  onTick: CronModuleCommand;
  /**
   * A function that will fire when the job is stopped with ```job.stop()```, and may also be called by ```onTick``` at the end of each run.
   */
  onComplete?: CronModuleCommand;
}

export default class CronModule<T extends DexareClient<any>> extends DexareModule<T> {
  crons = new Map<string, CronJob>();

  constructor(client: T) {
    super(client, {
      name: 'cron',
      description: 'Cron job manager'
    });

    this.filePath = __filename;
  }

  load() {
    if (this.client.config.cron?.loadFolder) this.registerFromFolder(this.client.config.cron.loadFolder);
  }

  unload() {
    for (const name in this.crons) {
      const job = this.crons.get(name)!;
      job.stop();
      this.crons.delete(name);
    }
  }

  /**
   * Registers cron jobs from a folder.
   * @param path The path to register from.
   */
  registerFromFolder(path: string) {
    return Util.iterateFolder(
      path,
      async (file) => this.register(require(join(process.cwd(), file))),
      '.cron.js'
    );
  }

  /**
   * Registers a cron job.
   * @param opts The options for the new cron job
   */
  register(opts: CronModuleJobParams) {
    const jobOpts: CronJobParameters = {
      cronTime: opts.cronTime,
      onTick: this._wrapFn(opts.onTick),
      onComplete: opts.onComplete ? this._wrapFn(opts.onComplete) : opts.onComplete,
      start: opts.start,
      timeZone: opts.timeZone,
      runOnInit: opts.runOnInit,
      utcOffset: opts.utcOffset,
      unrefTimeout: opts.unrefTimeout
    };
    const job = new CronJob(jobOpts);
    this.crons.set(opts.name, job);
    this.logger.log(`Registered cron job ${opts.name}.`);
    return job;
  }

  /**
   * Unregisters a cron job.
   * @param job The job name to unregister
   */
  unregister(job: string) {
    this.crons.delete(job);
    this.logger.log(`Unregistered cron job ${job}.`);
  }

  private _wrapFn(fn: CronModuleCommand): () => void {
    const _this = this;
    return function () {
      // @ts-ignore
      return fn(_this.client, this as CronJob);
    };
  }
}
