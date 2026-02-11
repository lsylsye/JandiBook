"""
앱 공통 뷰 (미디어 리다이렉트 등)
"""
from django.conf import settings
from django.shortcuts import redirect
from django.core.files.storage import default_storage


def default_profile_image_redirect(request):
    """
    버킷(Presigned) URL
    """
    if not getattr(settings, "USE_S3", False):
        from django.http import HttpResponseNotFound
        return HttpResponseNotFound()

    url = default_storage.url("media/profiles/default_profile.jpg")
    return redirect(url)
