import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

const POINT_UPLOAD_DIR = './uploads/points';

@Injectable()
export class FileUploadService {
  static avatarStorage = diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, callback) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  });

  static avatarFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Только изображения разрешены'), false);
    }
    callback(null, true);
  };

  static pointStorage = diskStorage({
    destination: (req, file, callback) => {
      fs.mkdirSync(POINT_UPLOAD_DIR, { recursive: true });
      callback(null, POINT_UPLOAD_DIR);
    },
    filename: (req, file, callback) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  });

  static pointFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Только изображения разрешены'), false);
    }
    callback(null, true);
  };
}
