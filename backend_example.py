# Django Backend Example for ProfileCategory with Arabic fields

# models.py
from django.db import models

class ProfileCategory(models.Model):
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    description_ar = models.TextField(blank=True, null=True)
    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profile_categories'
        ordering = ['-created_at']

    def __str__(self):
        return self.name or self.name_ar or f"Category {self.id}"

    def get_name_for_language(self, language='fr'):
        """Get the appropriate name field based on language"""
        if language == 'ar':
            return self.name_ar or self.name or ''
        else:
            return self.name or self.name_ar or ''

    def get_description_for_language(self, language='fr'):
        """Get the appropriate description field based on language"""
        if language == 'ar':
            return self.description_ar or self.description or ''
        else:
            return self.description or self.description_ar or ''


# serializers.py
from rest_framework import serializers

class ProfileCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileCategory
        fields = [
            'id', 'name', 'name_ar', 'description', 'description_ar',
            'profile', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validate that at least one of name or name_ar is provided
        """
        name = data.get('name', '').strip()
        name_ar = data.get('name_ar', '').strip()
        
        if not name and not name_ar:
            raise serializers.ValidationError(
                "Either 'name' or 'name_ar' must be provided"
            )
        
        return data

    def to_representation(self, instance):
        """
        Custom representation to include language-specific fields
        """
        data = super().to_representation(instance)
        
        # Add computed fields for easier frontend consumption
        data['display_name'] = instance.get_name_for_language()
        data['display_description'] = instance.get_description_for_language()
        
        return data


# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count

class ProfileCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileCategorySerializer
    
    def get_queryset(self):
        """
        Filter categories by profile_id and annotate with counts
        """
        profile_id = self.request.query_params.get('profile_id')
        if profile_id:
            queryset = ProfileCategory.objects.filter(profile_id=profile_id)
        else:
            queryset = ProfileCategory.objects.all()
        
        # Annotate with domain and item counts
        queryset = queryset.annotate(
            domains_count=Count('domains', distinct=True),
            items_count=Count('domains__items', distinct=True)
        )
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create a new category with language-specific field handling
        """
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response(
                {'error': 'profile_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add profile_id to the data
        data = request.data.copy()
        data['profile'] = profile_id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        """
        Update a category with language-specific field handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """
        Get categories with language-specific field selection
        """
        language = request.query_params.get('language', 'fr')
        profile_id = request.query_params.get('profile_id')
        
        queryset = self.get_queryset()
        if profile_id:
            queryset = queryset.filter(profile_id=profile_id)
        
        # Add language-specific computed fields
        for category in queryset:
            category.display_name = category.get_name_for_language(language)
            category.display_description = category.get_description_for_language(language)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'categories', ProfileCategoryViewSet, basename='category')

urlpatterns = [
    path('category/', include(router.urls)),
]

# Example API usage:
# GET /api/category/categories/?profile_id=1
# POST /api/category/categories/?profile_id=1
# PUT /api/category/categories/1/
# DELETE /api/category/categories/1/

# Example POST data for French:
# {
#   "name": "Compétences sociales",
#   "description": "Développement des compétences sociales"
# }

# Example POST data for Arabic:
# {
#   "name_ar": "المهارات الاجتماعية",
#   "description_ar": "تطوير المهارات الاجتماعية"
# }

# Example POST data with both languages:
# {
#   "name": "Compétences sociales",
#   "name_ar": "المهارات الاجتماعية",
#   "description": "Développement des compétences sociales",
#   "description_ar": "تطوير المهارات الاجتماعية"
# }
