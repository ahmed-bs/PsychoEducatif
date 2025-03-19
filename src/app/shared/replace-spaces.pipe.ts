import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceSpaces'
})
export class ReplaceSpacesPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\s+/g, ''); // Remplace tous les espaces par rien
  }
}