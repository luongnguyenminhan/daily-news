import { Module } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { SummaryController } from './summary.controller.js';
import { SummaryService } from './summary.service.js';
import { GeminiBatchClient } from './gemini-batch.client.js';

@Module({
  controllers: [SummaryController],
  providers: [
    SummaryService,
    {
      provide: GeminiBatchClient,
      useFactory: () =>
        new GeminiBatchClient(
          new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }),
          process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
        ),
    },
  ],
})
export class SummaryModule {}
