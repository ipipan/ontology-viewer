import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app.component';


@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
],
  bootstrap: [AppComponent]
})
export class AppModule { }