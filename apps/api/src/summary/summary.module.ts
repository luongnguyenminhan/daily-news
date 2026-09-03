import { Module } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { SummaryController } from './summary.controller.js';
import { SummaryService } from './summary.service.js';
import { GeminiSummaryClient } from './gemini-summary.client.js';

@Module({
  controllers: [SummaryController],
  providers: [
    SummaryService,
    {
      provide: GeminiSummaryClient,
      useFactory: () =>
        new GeminiSummaryClient(
          new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }),
          process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
        ),
    },
  ],
})
export class SummaryModule {}
