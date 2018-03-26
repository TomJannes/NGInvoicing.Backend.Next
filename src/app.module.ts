import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerModule } from './customer/customer.module';
import { SkuModule } from './sku/sku.module';
import { ProfileModule } from './profile/profile.module';
import { InvoiceModule } from './invoice/invoice.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/NGInvoicing'),
    UserModule,
    AuthModule,
    CustomerModule,
    SkuModule,
    ProfileModule,
    InvoiceModule
  ],
  controllers: [],
  components: [],
})
export class ApplicationModule {}
