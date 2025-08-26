# Arabic Fields Implementation for ProfileCategory

## Overview
This implementation adds support for Arabic language fields (`name_ar` and `description_ar`) to the ProfileCategory model, allowing the application to handle both French and Arabic content seamlessly.

## Changes Made

### Frontend Changes

#### 1. ProfileCategory Service (`src/app/core/services/ProfileCategory.service.ts`)
- **Enhanced language handling**: Added methods to prepare data based on current language
- **Improved data preparation**: The service now automatically maps form fields to the appropriate language-specific backend fields
- **Better validation**: Ensures at least one name field (French or Arabic) is provided

#### 2. Categories Component (`src/app/features/Client/evaluationConfig/categories/categories.component.ts`)
- **Language-aware form**: The form now shows different fields based on the current language
- **Smart data mapping**: When editing, the form intelligently populates fields based on language preference
- **Public language method**: Made `getCurrentLanguage()` public for template access

#### 3. Categories Template (`src/app/features/Client/evaluationConfig/categories/categories.component.html`)
- **Conditional form fields**: Shows Arabic or French fields based on current language
- **Textarea support**: Changed description fields to textarea for better UX
- **Language-specific labels**: Uses appropriate translation keys for each language

#### 4. Module Updates (`src/app/features/Client/evaluationConfig/evaluationConfig.module.ts`)
- **Added InputTextareaModule**: Required for the new textarea fields

#### 5. Translation Files
- **French translations** (`src/locale/fr.json`): Added Arabic field labels
- **Arabic translations** (`src/locale/ar.json`): Added Arabic field labels

### Backend Changes (Example provided in `backend_example.py`)

#### 1. Model Updates
```python
class ProfileCategory(models.Model):
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    description_ar = models.TextField(blank=True, null=True)
    # ... other fields
```

#### 2. Helper Methods
- `get_name_for_language(language)`: Returns appropriate name field
- `get_description_for_language(language)`: Returns appropriate description field

#### 3. Serializer Validation
- Ensures at least one name field is provided
- Handles both language fields appropriately

## How It Works

### Language Detection
The system detects the current language from `localStorage.getItem('selectedLanguage')`:
- `'fr'` → Uses French fields (`name`, `description`)
- `'ar'` → Uses Arabic fields (`name_ar`, `description_ar`)

### Form Behavior

#### When Language is French:
- Shows: Name (French) and Description (French) fields
- Saves: Data to `name` and `description` fields
- Displays: Content from `name` and `description` fields

#### When Language is Arabic:
- Shows: Name (Arabic) and Description (Arabic) fields  
- Saves: Data to `name_ar` and `description_ar` fields
- Displays: Content from `name_ar` and `description_ar` fields

### Data Flow

1. **User opens form**: Language is detected
2. **Form displays**: Language-specific fields are shown
3. **User enters data**: In the current language
4. **Data is prepared**: Service maps form data to appropriate backend fields
5. **API call**: Sends data with both language fields
6. **Backend saves**: Stores data in the correct fields
7. **Display**: Shows appropriate language content

## API Examples

### Creating a Category (French)
```json
POST /api/category/categories/?profile_id=1
{
  "name": "Compétences sociales",
  "description": "Développement des compétences sociales"
}
```

### Creating a Category (Arabic)
```json
POST /api/category/categories/?profile_id=1
{
  "name_ar": "المهارات الاجتماعية",
  "description_ar": "تطوير المهارات الاجتماعية"
}
```

### Creating a Category (Both Languages)
```json
POST /api/category/categories/?profile_id=1
{
  "name": "Compétences sociales",
  "name_ar": "المهارات الاجتماعية",
  "description": "Développement des compétences sociales",
  "description_ar": "تطوير المهارات الاجتماعية"
}
```

## Validation Rules

1. **At least one name required**: Either `name` or `name_ar` must be provided
2. **Language consistency**: The form automatically handles language-specific field mapping
3. **Language-specific display**: Content is displayed from the appropriate language fields based on current language setting

## Benefits

1. **Seamless multilingual support**: Users can work in their preferred language
2. **Backward compatibility**: Existing French-only data continues to work
3. **Flexible data entry**: Supports both single-language and bilingual content
4. **Improved UX**: Form adapts to user's language preference
5. **Data integrity**: Ensures at least one name field is always present

## Migration Notes

### For Existing Data
- Existing categories with only French fields will continue to work
- The system will automatically fall back to French fields when Arabic fields are empty
- No data migration is required

### For New Features
- When adding new categories, consider providing both language versions
- The system will automatically handle language-specific display
- API responses include both language fields for flexibility

## Testing

### Test Scenarios
1. **French language mode**: Verify French fields are shown and saved correctly
2. **Arabic language mode**: Verify Arabic fields are shown and saved correctly
3. **Language switching**: Verify form adapts when language is changed
4. **Edit existing**: Verify editing works for both language modes
5. **Validation**: Verify error messages when no name is provided

### Test Data
```javascript
// French test data
{
  name: "Test Category",
  description: "Test Description"
}

// Arabic test data  
{
  name_ar: "فئة اختبار",
  description_ar: "وصف اختبار"
}
```
